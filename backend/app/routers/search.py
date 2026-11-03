from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import MonumentType, SearchResult
from app.providers.base import ProviderFailure
from app.services.search import search_records

router = APIRouter(tags=["search"])


@router.get("/search", response_model=list[SearchResult])
def semantic_search(
    q: Annotated[str, Query(min_length=1, max_length=200)],
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
    type: Annotated[MonumentType | None, Query()] = None,
) -> list[SearchResult]:
    """Return approved records ranked by semantic relevance."""
    if not q.strip():
        raise HTTPException(status_code=422, detail={"code": "empty_query", "message": "Search query must not be empty"})
    try:
        return search_records(q, limit, type.value if type else None)
    except ProviderFailure as exc:
        raise HTTPException(status_code=503, detail={"code": "search_provider_unavailable", "message": exc.message}) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail={"code": "search_unavailable", "message": "Search is temporarily unavailable"}) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail={"code": "invalid_query", "message": str(exc)}) from exc
