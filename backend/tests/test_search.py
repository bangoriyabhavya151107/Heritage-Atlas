from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pytest import MonkeyPatch

from app.db import records as record_db
from app.main import app
from app.providers.fake import FakeAIProvider
from app.services import search as search_service

client = TestClient(app)


def _record_row(title: str, monument_type: str, features: list[str]) -> dict[str, object]:
    """Create a small approved row matching the public record schema."""
    return {
        "id": str(uuid4()),
        "created_at": "2026-11-01T12:00:00+00:00",
        "updated_at": "2026-11-01T12:00:00+00:00",
        "title": title,
        "monument_type": monument_type,
        "period": "unknown",
        "materials": [],
        "features": features,
        "status": "approved",
        "place_name": title,
        "location": {"type": "Point", "coordinates": [72.5, 23.0]},
    }


def _settings(minimum: float = 0.35) -> SimpleNamespace:
    return SimpleNamespace(search_min_similarity=minimum)


def test_search_orders_results_by_similarity_with_fake_provider(monkeypatch: MonkeyPatch) -> None:
    """Search sorts hydrated rows by their fake-RPC similarity scores."""
    low = _record_row("Low relevance stepwell", "stepwell", ["stone stairs"])
    high = _record_row("Carved pillar temple", "temple", ["carved pillars"])
    rpc_rows = [
        {"id": low["id"], "similarity": 0.54},
        {"id": high["id"], "similarity": 0.91},
    ]
    monkeypatch.setattr(search_service, "get_settings", lambda: _settings())
    monkeypatch.setattr(record_db, "match_records", lambda _embedding, _count: rpc_rows)
    monkeypatch.setattr(record_db, "get_records_by_ids", lambda _ids: [low, high])

    results = search_service.search_records("temple with carved pillars", provider=FakeAIProvider())

    assert [result.record.title for result in results] == ["Carved pillar temple", "Low relevance stepwell"]
    assert results[0].similarity == 0.91
    assert "features: carved pillars" in results[0].why_matched


def test_search_rejects_empty_query() -> None:
    """Whitespace-only input is not embedded or sent to the database."""
    with pytest.raises(ValueError, match="must not be empty"):
        search_service.search_records(" \t ", provider=FakeAIProvider())


def test_search_threshold_filters_low_similarity(monkeypatch: MonkeyPatch) -> None:
    """Candidates below the configured minimum are excluded before response mapping."""
    low = _record_row("Low score record", "stepwell", [])
    high = _record_row("High score record", "temple", [])
    rpc_rows = [
        {"id": low["id"], "similarity": 0.34},
        {"id": high["id"], "similarity": 0.81},
    ]
    monkeypatch.setattr(search_service, "get_settings", lambda: _settings(0.35))
    monkeypatch.setattr(record_db, "match_records", lambda _embedding, _count: rpc_rows)
    monkeypatch.setattr(record_db, "get_records_by_ids", lambda _ids: [low, high])

    results = search_service.search_records("heritage site", provider=FakeAIProvider())

    assert [result.record.title for result in results] == ["High score record"]


def test_search_returns_no_results_when_all_candidates_below_threshold(monkeypatch: MonkeyPatch) -> None:
    """A nonsense-like query yields an empty result list when all scores are too low."""
    row = _record_row("Any monument", "other", [])
    monkeypatch.setattr(search_service, "get_settings", lambda: _settings(0.75))
    monkeypatch.setattr(record_db, "match_records", lambda _embedding, _count: [{"id": row["id"], "similarity": 0.2}])
    monkeypatch.setattr(record_db, "get_records_by_ids", lambda _ids: [row])

    assert search_service.search_records("nonsense", provider=FakeAIProvider()) == []


def test_search_route_rejects_blank_and_overlong_queries() -> None:
    """The HTTP boundary rejects blank input and input beyond 200 characters."""
    blank = client.get("/search", params={"q": "   "})
    long = client.get("/search", params={"q": "a" * 201})

    assert blank.status_code == 422
    assert blank.json()["error"]["code"] == "empty_query"
    assert long.status_code == 422


def test_approved_records_response_is_geojson(monkeypatch: MonkeyPatch) -> None:
    """Approved rows become valid GeoJSON points and keep type/bbox filtering inputs."""
    row = _record_row("Mapped site", "temple", ["carved pillars"])
    row["source_url"] = "https://example.org/source"
    row["source_title"] = "Authoritative source listing"
    row["verification_notes"] = ["Coordinates are approximate map placement."]
    monkeypatch.setattr(record_db, "list_approved", lambda bbox, monument_type: [row])

    response = client.get("/records", params={"type": "temple", "bbox": "72,22,73,24"})

    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "FeatureCollection"
    assert body["features"][0]["type"] == "Feature"
    assert body["features"][0]["geometry"] == {"type": "Point", "coordinates": [72.5, 23.0]}
    assert body["features"][0]["properties"]["lat"] == 23.0
    assert body["features"][0]["properties"]["source_url"] == "https://example.org/source"
    assert body["features"][0]["properties"]["verification_notes"] == ["Coordinates are approximate map placement."]
