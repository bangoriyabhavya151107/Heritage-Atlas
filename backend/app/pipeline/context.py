from dataclasses import dataclass, field
from uuid import UUID

from app.models.schemas import ExtractedFields


@dataclass
class PipelineContext:
    """Data passed from stage to stage for one uploaded heritage record."""

    record_id: UUID
    image_bytes: bytes
    place_name: str
    original_text: str = ""
    detected_language: str | None = None
    ocr_confidence: float | None = None
    extracted: ExtractedFields | None = None
    english_text: str = ""
    summary: str | None = None
    embedding: list[float] | None = None
    processed_image_bytes: bytes | None = None
    has_text: bool = True
    extraction_warning: str | None = None
    metadata: dict[str, str] = field(default_factory=dict)


class PipelineError(Exception):
    """A known, user-reportable failure associated with one pipeline stage."""

    def __init__(self, stage: str, message: str) -> None:
        super().__init__(message)
        self.stage = stage
        self.message = message
