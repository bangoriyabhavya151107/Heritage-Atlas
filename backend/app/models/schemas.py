from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RecordStatus(StrEnum):
    """Allowed record workflow states."""

    UPLOADED = "uploaded"
    PROCESSING = "processing"
    NEEDS_REVIEW = "needs_review"
    APPROVED = "approved"
    FAILED = "failed"


class MonumentType(StrEnum):
    """Supported heritage record categories."""

    STEPWELL = "stepwell"
    FORT = "fort"
    TEMPLE = "temple"
    MOSQUE = "mosque"
    CRAFT = "craft"
    OTHER = "other"


class ExtractedFields(BaseModel):
    """Pydantic-validated heritage metadata returned by an AI provider."""

    title: str | None = None
    monument_type: MonumentType | None = None
    period: str | None = "unknown"
    materials: list[str] = Field(default_factory=list)
    features: list[str] = Field(default_factory=list)
    language: str | None = None
    summary: str | None = None
    confidence: float = Field(ge=0.0, le=1.0)

    @field_validator("summary")
    @classmethod
    def summary_at_most_sixty_words(cls, value: str | None) -> str | None:
        """Reject summaries longer than the presentation limit."""
        if value is not None and len(value.split()) > 60:
            raise ValueError("summary must contain at most 60 words")
        return value


class RecordCreateResponse(BaseModel):
    """Acknowledgement returned when an image record is created."""

    id: UUID
    status: RecordStatus


class SignedImageOut(BaseModel):
    """Short-lived URL for a private source image."""

    signed_url: str
    expires_in: int = Field(gt=0, le=600)


class RecordPatch(BaseModel):
    """Fields that may be edited during review."""

    title: str | None = None
    monument_type: MonumentType | None = None
    period: str | None = None
    materials: list[str] | None = None
    features: list[str] | None = None
    language: str | None = None
    original_text: str | None = None
    english_text: str | None = None
    summary: str | None = None
    place_name: str | None = None
    region: str | None = None


class RecordOut(BaseModel):
    """Public representation of a heritage record."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
    title: str | None = None
    monument_type: MonumentType | None = None
    period: str | None = None
    materials: list[str] = Field(default_factory=list)
    features: list[str] = Field(default_factory=list)
    language: str | None = None
    original_text: str | None = None
    english_text: str | None = None
    summary: str | None = None
    image_path: str | None = None
    source_url: str | None = None
    source_title: str | None = None
    verification_notes: list[str] = Field(default_factory=list)
    place_name: str | None = None
    region: str | None = None
    lat: float | None = None
    lng: float | None = None
    ocr_confidence: float | None = None
    status: RecordStatus
    pipeline_stage: str | None = None
    warning: str | None = None
    error: str | None = None


class SearchResult(BaseModel):
    """A semantic search hit, score, and concise evidence-based explanation."""

    record: RecordOut
    similarity: float = Field(ge=-1.0, le=1.0)
    why_matched: str
