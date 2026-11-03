import logging

from app.pipeline.context import PipelineContext, PipelineError
from app.providers.ocr import OCRProvider, OCRProviderError, TesseractOCRProvider

logger = logging.getLogger(__name__)
OCR_LANGUAGES = "eng+hin+guj"
MINIMUM_TEXT_CHARACTERS = 20


def ocr(context: PipelineContext, provider: OCRProvider | None = None) -> PipelineContext:
    """Recognize multilingual text through a replaceable OCR provider."""
    if context.processed_image_bytes is None:
        raise PipelineError("ocr", "Processed image is missing; preprocessing must run first")
    try:
        result = (provider or TesseractOCRProvider()).recognize(context.processed_image_bytes, OCR_LANGUAGES)
        context.original_text = " ".join(result.words).strip()
        context.ocr_confidence = sum(result.confidences) / len(result.confidences) if result.confidences else 0.0
        context.has_text = len(context.original_text) >= MINIMUM_TEXT_CHARACTERS
        if not context.has_text:
            logger.info("OCR found fewer than %s characters; using image-aware extraction", MINIMUM_TEXT_CHARACTERS)
        return context
    except OCRProviderError as exc:
        logger.exception("OCR failed for record %s", context.record_id)
        raise PipelineError("ocr", str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected OCR-stage failure for record %s", context.record_id)
        raise PipelineError("ocr", f"OCR stage failed: {type(exc).__name__}") from exc
