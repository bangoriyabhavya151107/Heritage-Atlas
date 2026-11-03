import logging

from app.pipeline.context import PipelineContext, PipelineError
from app.providers.base import AIProvider, ProviderFailure

logger = logging.getLogger(__name__)
MAX_SEARCH_DOCUMENT_CHARACTERS = 2000


def build_search_document(context: PipelineContext) -> str:
    """Return the stable human-readable field sequence used for semantic retrieval."""
    extracted = context.extracted
    if extracted is None:
        raise PipelineError("embed", "Extracted fields are missing")
    fields = [
        extracted.title or "",
        extracted.monument_type.value if extracted.monument_type else "",
        extracted.period or "",
        ", ".join(extracted.materials),
        ", ".join(extracted.features),
        context.summary or "",
        context.english_text,
    ]
    document = " ".join(value for value in fields if value).strip()
    if not document:
        document = f"Heritage record at {context.place_name}".strip()
    return document[:MAX_SEARCH_DOCUMENT_CHARACTERS]


def embed(context: PipelineContext, provider: AIProvider) -> PipelineContext:
    """Generate and dimension-check a vector for the record's search document."""
    document = build_search_document(context)
    try:
        vector = provider.embed(document)
        if len(vector) != 768:
            raise ValueError(f"provider returned {len(vector)} dimensions; database requires 768")
        context.embedding = vector
        return context
    except PipelineError:
        raise
    except ProviderFailure as exc:
        raise PipelineError("embed", exc.message) from exc
    except Exception as exc:
        logger.exception("Embedding failed for %s", context.record_id)
        raise PipelineError("embed", f"Embedding failed: {exc}") from exc
