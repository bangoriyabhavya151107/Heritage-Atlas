import re
from functools import lru_cache
from typing import Any

from app.core.config import get_settings
from app.db import records as record_db
from app.models.schemas import RecordOut, SearchResult
from app.providers.base import AIProvider, ProviderFailure
from app.providers.gemini import GeminiProvider


@lru_cache(maxsize=1)
def _configured_provider() -> AIProvider:
    """Build the configured real provider once; fake providers are injected only by tests."""
    settings = get_settings()
    if settings.ai_provider != "gemini":
        raise ProviderFailure("search", "Semantic search requires AI_PROVIDER=gemini")
    return GeminiProvider()


@lru_cache(maxsize=100)
def _cached_query_embedding(query: str) -> tuple[float, ...]:
    """Cache normalized semantic query embeddings to avoid repeated API calls."""
    return tuple(_configured_provider().embed(query))


def _tokens(value: str) -> set[str]:
    """Split text into lowercase Unicode-aware keyword tokens."""
    return {token.casefold() for token in re.findall(r"[^\W_]+", value, flags=re.UNICODE) if len(token) > 2}


def _why_matched(query: str, record: RecordOut) -> str:
    """Describe lexical evidence that complements the semantic similarity score."""
    query_tokens = _tokens(query)
    evidence: list[str] = []
    if record.monument_type and record.monument_type.value.casefold() in query_tokens:
        evidence.append(f"type: {record.monument_type.value}")

    matched_features = [feature for feature in record.features if feature.casefold() in query.casefold()]
    if not matched_features:
        matched_features = [
            feature for feature in record.features
            if query_tokens.intersection(_tokens(feature))
        ]
    if matched_features:
        evidence.append("features: " + ", ".join(matched_features[:2]))

    keyword_text = " ".join(
        value for value in (record.title, record.place_name, record.period, record.summary, record.english_text)
        if value
    )
    if query_tokens.intersection(_tokens(keyword_text)):
        evidence.append("shared keywords")

    return "; ".join(evidence[:3]) or "Semantic match to the record description"


def _record_from_row(row: dict[str, Any]) -> RecordOut:
    """Map a database row, including a PostGIS GeoJSON point, to the public schema."""
    mapped = dict(row)
    location = mapped.pop("location", None)
    if isinstance(location, dict):
        coordinates = location.get("coordinates")
        if isinstance(coordinates, list) and len(coordinates) == 2:
            mapped["lng"], mapped["lat"] = coordinates
    return RecordOut.model_validate(mapped)


def search_records(
    query: str,
    limit: int = 10,
    monument_type: str | None = None,
    provider: AIProvider | None = None,
) -> list[SearchResult]:
    """Search approved records by semantic similarity and explain lexical overlap."""
    cleaned_query = " ".join(query.split())
    if not cleaned_query:
        raise ValueError("Search query must not be empty")
    if len(cleaned_query) > 200:
        raise ValueError("Search query must not exceed 200 characters")

    if provider is None:
        embedding = _cached_query_embedding(cleaned_query)
    else:
        embedding = tuple(provider.embed(cleaned_query))
    settings = get_settings()
    candidates = record_db.match_records(list(embedding), 100)
    candidate_scores: dict[str, float] = {}
    ordered_ids: list[str] = []
    for candidate in candidates:
        record_id = str(candidate["id"])
        score = float(candidate["similarity"])
        candidate_scores[record_id] = score
        ordered_ids.append(record_id)

    records = record_db.get_records_by_ids(ordered_ids)
    records_by_id = {str(row["id"]): row for row in records}
    results: list[SearchResult] = []
    for record_id in ordered_ids:
        row = records_by_id.get(record_id)
        score = candidate_scores[record_id]
        if row is None or score < settings.search_min_similarity:
            continue
        if monument_type and row.get("monument_type") != monument_type:
            continue
        record = _record_from_row(row)
        results.append(SearchResult(record=record, similarity=score, why_matched=_why_matched(cleaned_query, record)))
    results.sort(key=lambda result: result.similarity, reverse=True)
    return results[: max(1, min(limit, 50))]
