import logging
import json

from pydantic import ValidationError

from app.models.schemas import ExtractedFields
from app.pipeline.context import PipelineContext, PipelineError
from app.providers.base import AIProvider, ProviderFailure

logger = logging.getLogger(__name__)


def extract(context: PipelineContext, provider: AIProvider) -> PipelineContext:
    """Extract metadata, validate it, retry invalid output once, then flag a review fallback."""
    last_error: str | None = None
    for attempt in range(2):
        try:
            raw = provider.extract_fields(
                context.original_text,
                context.place_name,
                context.image_bytes,
                validation_error=last_error,
            )
            if isinstance(raw, str):
                parsed = ExtractedFields.model_validate_json(raw)
            else:
                parsed = ExtractedFields.model_validate(raw)
            context.extracted = parsed
            context.detected_language = parsed.language
            context.summary = parsed.summary
            return context
        except (ValidationError, ValueError, json.JSONDecodeError) as exc:
            last_error = str(exc)
            logger.warning("Extraction output failed validation on attempt %s for %s", attempt + 1, context.record_id)
        except ProviderFailure as exc:
            raise PipelineError("extract", exc.message) from exc
        except Exception as exc:
            logger.exception("Extraction provider failed for %s", context.record_id)
            raise PipelineError("extract", f"Extraction failed: {type(exc).__name__}") from exc
    context.extracted = ExtractedFields(
        title=None,
        monument_type=None,
        period=None,
        materials=[],
        features=[],
        language=None,
        summary=None,
        confidence=0.0,
    )
    context.detected_language = None
    context.summary = None
    context.extraction_warning = "AI extraction output was invalid twice; metadata needs manual review."
    return context
