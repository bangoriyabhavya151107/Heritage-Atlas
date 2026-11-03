import logging

from app.pipeline.context import PipelineContext, PipelineError
from app.providers.base import AIProvider, ProviderFailure

logger = logging.getLogger(__name__)


def translate(context: PipelineContext, provider: AIProvider) -> PipelineContext:
    """Translate non-English OCR text while retaining its original form."""
    language = (context.detected_language or "").strip().lower()
    if not context.original_text or context.extraction_warning or language in {"english", "en", "eng"}:
        context.english_text = context.original_text
        return context
    try:
        context.english_text = provider.translate(context.original_text)
        return context
    except ProviderFailure as exc:
        raise PipelineError("translate", exc.message) from exc
    except Exception as exc:
        logger.exception("Translation failed for %s", context.record_id)
        raise PipelineError("translate", f"Translation failed: {type(exc).__name__}") from exc
