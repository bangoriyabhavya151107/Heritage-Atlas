import json
import logging
import time
from typing import Any
from uuid import UUID

from app.core.config import get_settings
from app.db import records as record_db
from app.models.schemas import ExtractedFields
from app.pipeline.context import PipelineContext, PipelineError
from app.pipeline.embed import embed
from app.pipeline.extract import extract
from app.pipeline.ocr import ocr
from app.pipeline.preprocess import preprocess
from app.pipeline.save import save
from app.pipeline.translate import translate
from app.providers.base import AIProvider, ProviderFailure
from app.providers.gemini import GeminiProvider
from app.providers.storage import ImageStorage, SupabaseImageStorage

logger = logging.getLogger(__name__)
STAGE_NAMES = ("preprocess", "ocr", "extract", "translate", "embed", "save")


def _make_provider() -> AIProvider:
    """Build the configured real provider; tests pass fake providers explicitly."""
    settings = get_settings()
    if settings.ai_provider != "gemini":
        raise ValueError("AI_PROVIDER must be gemini; fake providers are injected only by tests")
    return GeminiProvider()


def _initial_context(record: dict[str, Any], image_bytes: bytes) -> PipelineContext:
    """Restore persisted state so a retry can continue at its failed stage."""
    context = PipelineContext(
        record_id=UUID(str(record["id"])),
        image_bytes=image_bytes,
        place_name=record.get("place_name") or "",
        original_text=record.get("original_text") or "",
        detected_language=record.get("language"),
        ocr_confidence=record.get("ocr_confidence"),
        english_text=record.get("english_text") or "",
        summary=record.get("summary"),
        extraction_warning=record.get("warning"),
    )
    if any(record.get(key) is not None for key in ("title", "monument_type", "period", "summary")) or record.get("warning"):
        context.extracted = ExtractedFields(
            title=record.get("title"),
            monument_type=record.get("monument_type"),
            period=record.get("period") or "unknown",
            materials=record.get("materials") or [],
            features=record.get("features") or [],
            language=record.get("language"),
            summary=record.get("summary"),
            confidence=0.0,
        )
    context.embedding = record.get("embedding")
    return context


def _checkpoint(context: PipelineContext, stage: str) -> None:
    """Persist completed stage outputs before proceeding to the next provider call."""
    values: dict[str, Any] = {}
    if stage == "ocr":
        values = {"original_text": context.original_text, "ocr_confidence": context.ocr_confidence}
    elif stage == "extract" and context.extracted is not None:
        extracted = context.extracted
        values = {
            "title": extracted.title,
            "monument_type": extracted.monument_type.value if extracted.monument_type else None,
            "period": extracted.period,
            "materials": extracted.materials,
            "features": extracted.features,
            "language": extracted.language,
            "summary": context.summary,
            "warning": context.extraction_warning,
        }
    elif stage == "translate":
        values = {"english_text": context.english_text}
    elif stage == "embed":
        values = {"embedding": context.embedding}
    if values:
        row = record_db.update_record(context.record_id, values)
        if row is None:
            raise PipelineError(stage, "Record disappeared while saving stage results")


def _execute_stage(stage: str, context: PipelineContext, provider: AIProvider | None) -> PipelineContext:
    """Dispatch one named pipeline stage to its isolated function."""
    if stage == "preprocess":
        return preprocess(context)
    if stage == "ocr":
        return ocr(context)
    if stage == "extract":
        if provider is None:
            raise PipelineError(stage, "AI provider was not initialized")
        return extract(context, provider)
    if stage == "translate":
        if provider is None:
            raise PipelineError(stage, "AI provider was not initialized")
        return translate(context, provider)
    if stage == "embed":
        if provider is None:
            raise PipelineError(stage, "AI provider was not initialized")
        return embed(context, provider)
    if stage == "save":
        return save(context)
    raise PipelineError(stage, f"Unknown pipeline stage: {stage}")


def run_pipeline(
    record_id: UUID,
    provider: AIProvider | None = None,
    storage: ImageStorage | None = None,
    start_at: str | None = None,
) -> None:
    """Run stages in order and persist progress/status for background polling and retry."""
    active_stage = start_at or "preprocess"
    stage_started = time.perf_counter()
    try:
        row = record_db.get_record(record_id)
        if row is None:
            raise PipelineError(active_stage, "Record not found")
        if start_at is None and row.get("status") == "failed":
            active_stage = row.get("pipeline_stage") or "preprocess"
        if active_stage not in STAGE_NAMES:
            raise PipelineError(active_stage, "Stored pipeline stage is not retryable")
        client = record_db.get_client()
        image_storage = storage or SupabaseImageStorage(client)
        image_bytes = image_storage.download(row["image_path"])
        context = _initial_context(row, image_bytes)
        ai_provider = provider
        start_index = STAGE_NAMES.index(active_stage)
        for stage in STAGE_NAMES[start_index:]:
            active_stage = stage
            record_db.set_status(record_id, "processing", stage, None)
            stage_started = time.perf_counter()
            if stage in {"extract", "translate", "embed"} and ai_provider is None:
                try:
                    ai_provider = _make_provider()
                except ProviderFailure as exc:
                    raise PipelineError(stage, exc.message) from exc
            context = _execute_stage(stage, context, ai_provider)
            if stage != "save":
                _checkpoint(context, stage)
            duration_ms = round((time.perf_counter() - stage_started) * 1000, 2)
            logger.info(json.dumps({"event": "pipeline_stage_complete", "record_id": str(record_id), "stage": stage, "duration_ms": duration_ms}))
            stage_started = time.perf_counter()
    except PipelineError as exc:
        duration_ms = round((time.perf_counter() - stage_started) * 1000, 2)
        logger.error(json.dumps({"event": "pipeline_stage_failed", "record_id": str(record_id), "stage": exc.stage, "duration_ms": duration_ms, "error": exc.message}))
        record_db.set_status(record_id, "failed", exc.stage, exc.message)
    except Exception as exc:
        duration_ms = round((time.perf_counter() - stage_started) * 1000, 2)
        logger.exception("Unexpected pipeline failure for record %s at %s", record_id, active_stage)
        message = f"Unexpected pipeline error: {type(exc).__name__}: {exc}"
        logger.error(json.dumps({"event": "pipeline_stage_failed", "record_id": str(record_id), "stage": active_stage, "duration_ms": duration_ms, "error": message}))
        record_db.set_status(record_id, "failed", active_stage, message)
