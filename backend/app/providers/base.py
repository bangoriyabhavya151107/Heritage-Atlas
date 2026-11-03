from abc import ABC, abstractmethod


class AIProvider(ABC):
    """Swappable AI interface for extraction, translation, and embeddings."""

    @abstractmethod
    def extract_fields(self, text: str, place_name: str, image_bytes: bytes, validation_error: str | None = None) -> object:
        """Return raw structured field data; callers validate it with Pydantic."""
        raise NotImplementedError

    @abstractmethod
    def translate(self, text: str) -> str:
        """Translate source text into English."""
        raise NotImplementedError

    @abstractmethod
    def embed(self, document: str) -> list[float]:
        """Return a configured-size vector for a search document."""
        raise NotImplementedError


class ProviderFailure(Exception):
    """A provider call failed in a way the pipeline can report safely."""

    def __init__(self, operation: str, message: str) -> None:
        super().__init__(message)
        self.operation = operation
        self.message = message
