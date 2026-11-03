import logging
from typing import Any

from app.db.records import update_record
from app.pipeline.context import PipelineContext, PipelineError

logger = logging.getLogger(__name__)


def save(context: PipelineContext) -> PipelineContext:
    """Persist every completed field without ever auto-approving the record."""
    extracted = context.extracted
    if extracted is None or context.embedding is None:
        raise PipelineError("save", "Cannot save pipeline output without extraction fields and an embedding")
    values: dict[str, Any] = {
        "original_text": context.original_text,
        "ocr_confidence": context.ocr_confidence,
        "title": extracted.title,
        "monument_type": extracted.monument_type.value if extracted.monument_type else None,
        "period": extracted.period,
        "materials": extracted.materials,
        "features": extracted.features,
        "language": extracted.language,
        "english_text": context.english_text,
        "summary": context.summary,
        "embedding": context.embedding,
        "status": "needs_review",
        "pipeline_stage": "complete",
        "error": None,
        "warning": context.extraction_warning,
    }
    try:
        row = update_record(context.record_id, values)
        if row is None:
            raise ValueError("record no longer exists")
        return context
    except Exception as exc:
        logger.exception("Could not save pipeline results for %s", context.record_id)
        raise PipelineError("save", f"Could not save pipeline results: {exc}") from exc
