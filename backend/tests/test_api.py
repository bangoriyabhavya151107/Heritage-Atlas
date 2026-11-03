from uuid import uuid4

from fastapi.testclient import TestClient
from pytest import MonkeyPatch

from app.core.config import Settings
from app.db import records as record_db
from app.main import app

client = TestClient(app)


def test_health() -> None:
    """Health endpoint responds without database credentials."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_ai_provider_defaults_to_gemini(monkeypatch: MonkeyPatch) -> None:
    """A clean real-run configuration selects Gemini; tests inject fake providers directly."""
    monkeypatch.delenv("AI_PROVIDER", raising=False)
    settings = Settings(_env_file=None)
    assert settings.ai_provider == "gemini"


def test_create_record_rejects_unsupported_image_type() -> None:
    """Unsupported uploads fail before Storage or database access."""
    response = client.post(
        "/records",
        data={"place_name": "Test site", "lat": "25.0", "lng": "75.0"},
        files={"image": ("note.txt", b"not an image", "text/plain")},
    )
    assert response.status_code == 415
    assert response.json()["error"]["code"] == "unsupported_image_type"


def test_approve_from_wrong_state_returns_conflict(monkeypatch: MonkeyPatch) -> None:
    """An uploaded record cannot bypass the review state."""
    record_id = uuid4()
    monkeypatch.setattr(record_db, "get_record", lambda _record_id: {"id": str(record_id), "status": "uploaded"})
    response = client.post(f"/records/{record_id}/approve")
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "invalid_record_state"


def test_record_image_returns_short_lived_signed_url(monkeypatch: MonkeyPatch) -> None:
    """The API signs a private object for five minutes instead of opening the bucket."""
    from app.routers import records as records_router

    record_id = uuid4()
    monkeypatch.setattr(record_db, "get_record", lambda _record_id: {"id": str(record_id), "image_path": "scan.png"})
    monkeypatch.setattr(record_db, "get_client", lambda: object())

    class FakeStorage:
        def __init__(self, _client: object) -> None:
            pass

        def create_signed_url(self, image_path: str, expires_in: int) -> str:
            assert image_path == "scan.png"
            assert expires_in == 300
            return "https://storage.example/signed/scan.png?token=temporary"

    monkeypatch.setattr(records_router, "SupabaseImageStorage", FakeStorage)
    response = client.get(f"/records/{record_id}/image")

    assert response.status_code == 200
    assert response.json() == {
        "signed_url": "https://storage.example/signed/scan.png?token=temporary",
        "expires_in": 300,
    }


def test_record_image_without_source_returns_not_found(monkeypatch: MonkeyPatch) -> None:
    """A record without an uploaded source has no signed image URL."""
    record_id = uuid4()
    monkeypatch.setattr(record_db, "get_record", lambda _record_id: {"id": str(record_id), "image_path": None})

    response = client.get(f"/records/{record_id}/image")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "image_not_found"
