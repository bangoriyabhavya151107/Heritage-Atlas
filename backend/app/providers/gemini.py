import json
import logging
import threading
import time
from collections.abc import Callable
from typing import TypeVar

from google import genai
from google.genai import errors, types

from app.core.config import get_settings
from app.models.schemas import ExtractedFields
from app.providers.base import AIProvider, ProviderFailure
from app.providers.prompts import EXTRACTION_PROMPT_V1

logger = logging.getLogger(__name__)
ResponseT = TypeVar("ResponseT")
_rate_limit_lock = threading.Lock()
_next_request_at = 0.0


class GeminiProvider(AIProvider):
    """Gemini Developer API adapter built on Google's official google-genai SDK."""

    def __init__(self) -> None:
        settings = get_settings()
        if not settings.gemini_api_key:
            raise ProviderFailure("configure", "GEMINI_API_KEY is not configured")
        if not settings.gemini_model or not settings.embedding_model:
            raise ProviderFailure("configure", "GEMINI_MODEL and EMBEDDING_MODEL must be configured")
        self._settings = settings
        self._client = genai.Client(api_key=settings.gemini_api_key)

    def _rate_limit(self) -> None:
        """Serialize API starts with a small pause to reduce free-tier bursts."""
        global _next_request_at
        with _rate_limit_lock:
            now = time.monotonic()
            delay = max(0.0, _next_request_at - now)
            if delay:
                time.sleep(delay)
            _next_request_at = time.monotonic() + 0.5

    @staticmethod
    def _retryable(exc: Exception) -> bool:
        """Return whether an SDK exception represents a 429 or 5xx response."""
        if isinstance(exc, errors.APIError):
            code = exc.code
            return code == 429 or (isinstance(code, int) and 500 <= code <= 599)
        return False

    def _call(self, operation: str, callback: Callable[[], ResponseT]) -> ResponseT:
        """Invoke one provider request with at most two exponential-backoff retries."""
        for attempt in range(3):
            self._rate_limit()
            try:
                return callback()
            except Exception as exc:
                if attempt < 2 and self._retryable(exc):
                    wait_seconds = 0.5 * (2**attempt)
                    logger.warning("Gemini %s returned a retryable error; retry %s/2 in %.1fs", operation, attempt + 1, wait_seconds)
                    time.sleep(wait_seconds)
                    continue
                code = exc.code if isinstance(exc, errors.APIError) else None
                reason = f"HTTP {code}" if code else type(exc).__name__
                detail = str(exc).splitlines()[0][:240]
                suffix = f": {detail}" if detail else ""
                raise ProviderFailure(operation, f"Gemini {operation} failed ({reason}){suffix}") from exc
        raise ProviderFailure(operation, f"Gemini {operation} failed after retries")

    def extract_fields(self, text: str, place_name: str, image_bytes: bytes, validation_error: str | None = None) -> object:
        """Generate schema-constrained candidate metadata from text and image context."""
        correction = f"\nThe previous response failed schema validation: {validation_error}. Correct the output." if validation_error else ""
        prompt = f"{correction}\nPlace name: {place_name}\nOCR text (may be empty): {text or '[no readable text]'}"
        mime_type = "image/jpeg"
        for extension, candidate in ((b"\x89PNG\r\n\x1a\n", "image/png"), (b"RIFF", "image/webp")):
            if image_bytes.startswith(extension):
                mime_type = candidate
                break
        parts = [types.Part.from_text(text=prompt), types.Part.from_bytes(data=image_bytes, mime_type=mime_type)]
        config = types.GenerateContentConfig(
            system_instruction=EXTRACTION_PROMPT_V1,
            response_mime_type="application/json",
            response_schema=ExtractedFields.model_json_schema(),
            temperature=0.1,
            http_options=types.HttpOptions(timeout=30_000),
        )
        response = self._call("extraction", lambda: self._client.models.generate_content(
            model=self._settings.gemini_model,
            contents=parts,
            config=config,
        ))
        if not response.text:
            raise ProviderFailure("extraction", "Gemini returned an empty extraction response")
        try:
            return json.loads(response.text)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Gemini returned invalid JSON: {exc.msg}") from exc

    def translate(self, text: str) -> str:
        """Translate supplied OCR text to English while preserving uncertain wording."""
        if not text.strip():
            return ""
        response = self._call("translation", lambda: self._client.models.generate_content(
            model=self._settings.gemini_model,
            contents=f"Translate the following heritage inscription into English. Preserve names and uncertainty. Return only the translation.\n\n{text}",
            config=types.GenerateContentConfig(temperature=0.1, http_options=types.HttpOptions(timeout=30_000)),
        ))
        if not response.text:
            raise ProviderFailure("translation", "Gemini returned an empty translation")
        return response.text.strip()

    def embed(self, document: str) -> list[float]:
        """Generate an embedding and verify its length against the PostgreSQL vector schema."""
        if self._settings.embedding_dim != 768:
            raise ProviderFailure("embedding", "EMBEDDING_DIM must be 768 to match vector(768) in the current database migration")
        response = self._call("embedding", lambda: self._client.models.embed_content(
            model=self._settings.embedding_model,
            contents=document,
            config=types.EmbedContentConfig(
                output_dimensionality=self._settings.embedding_dim,
                http_options=types.HttpOptions(timeout=30_000),
            ),
        ))
        if not response.embeddings or response.embeddings[0].values is None:
            raise ProviderFailure("embedding", "Gemini returned no embedding values")
        vector = [float(value) for value in response.embeddings[0].values]
        if len(vector) != self._settings.embedding_dim:
            raise ProviderFailure("embedding", f"Gemini returned {len(vector)} dimensions; expected {self._settings.embedding_dim}")
        return vector
