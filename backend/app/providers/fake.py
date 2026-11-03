import hashlib

from app.core.config import get_settings
from app.providers.base import AIProvider


class FakeAIProvider(AIProvider):
    """Deterministic provider for tests and offline demos; never calls an API."""

    def extract_fields(self, text: str, place_name: str, image_bytes: bytes, validation_error: str | None = None) -> object:
        """Return repeatable plausible fields based only on supplied input."""
        language = "Gujarati" if any("\u0a80" <= char <= "\u0aff" for char in text) else "English" if text else None
        lowered = text.lower()
        monument_type = next((kind for kind in ("stepwell", "fort", "temple", "mosque", "craft") if kind in lowered), "other" if text else None)
        return {
            "title": place_name or None,
            "monument_type": monument_type,
            "period": "unknown",
            "materials": [],
            "features": [],
            "language": language,
            "summary": " ".join(text.split()[:60]) if text else f"Image submitted for {place_name}.",
            "confidence": 0.55,
        }

    def translate(self, text: str) -> str:
        """Return source text unchanged for offline operation."""
        return text

    def embed(self, document: str) -> list[float]:
        """Build a normalized deterministic vector by expanding a SHA-256 digest."""
        dimension = get_settings().embedding_dim
        values: list[float] = []
        counter = 0
        while len(values) < dimension:
            digest = hashlib.sha256(f"{counter}:{document}".encode("utf-8")).digest()
            values.extend((byte / 127.5) - 1.0 for byte in digest)
            counter += 1
        values = values[:dimension]
        norm = sum(value * value for value in values) ** 0.5
        if norm == 0:
            return [0.0] * dimension
        return [value / norm for value in values]
