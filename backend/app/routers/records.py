import logging
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, Query, UploadFile, status

from app.db import records as record_db
from app.models.schemas import MonumentType, RecordCreateResponse, RecordOut, RecordPatch, RecordStatus, SignedImageOut
from app.providers.storage import SupabaseImageStorage
from app.services.records import create_uploaded_record

router = APIRouter(tags=["records"])
logger = logging.getLogger(__name__)
MAX_IMAGE_BYTES = 8 * 1024 * 1024
SIGNED_IMAGE_TTL_SECONDS = 300
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _as_record_out(row: dict[str, Any]) -> RecordOut:
    """Convert a database row and PostGIS GeoJSON point into the API schema."""
    mapped = dict(row)
    location = mapped.pop("location", None)
    if isinstance(location, dict) and location.get("coordinates"):
        mapped["lng"], mapped["lat"] = location["coordinates"]
    return RecordOut.model_validate(mapped)


def _not_found() -> HTTPException:
    return HTTPException(status_code=404, detail={"code": "record_not_found", "message": "Record not found"})


@router.get("/health")
def health() -> dict[str, str]:
    """Return a liveness response without requiring external services."""
    return {"status": "ok"}


@router.post("/records", response_model=RecordCreateResponse, status_code=status.HTTP_201_CREATED)
async def upload_record(
    background_tasks: BackgroundTasks,
    image: Annotated[UploadFile, File(...)],
    place_name: Annotated[str, Form(min_length=1, max_length=300)],
    lat: Annotated[float, Form(ge=-90, le=90)],
    lng: Annotated[float, Form(ge=-180, le=180)],
) -> RecordCreateResponse:
    """Validate and persist an image upload, returning its record identifier."""
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail={"code": "unsupported_image_type", "message": "Image must be JPEG, PNG, or WebP"})
    content = await image.read(MAX_IMAGE_BYTES + 1)
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail={"code": "image_too_large", "message": "Image must not exceed 8 MB"})
    if not content:
        raise HTTPException(status_code=400, detail={"code": "empty_image", "message": "Image file is empty"})
    storage = SupabaseImageStorage(record_db.get_client())
    row = create_uploaded_record(content, image.filename or "upload", image.content_type, place_name, lat, lng, storage)
    from app.services.pipeline_runner import run_pipeline

    background_tasks.add_task(run_pipeline, UUID(str(row["id"])))
    return RecordCreateResponse(id=row["id"], status=row["status"])


@router.get("/records/{record_id}", response_model=RecordOut)
def read_record(record_id: UUID) -> RecordOut:
    """Read a record by UUID."""
    row = record_db.get_record(record_id)
    if row is None:
        raise _not_found()
    return _as_record_out(row)


@router.get("/records/{record_id}/image", response_model=SignedImageOut)
def get_record_image(record_id: UUID) -> SignedImageOut:
    """Create a five-minute signed URL without making the Storage bucket public."""
    row = record_db.get_record(record_id)
    if row is None:
        raise _not_found()
    image_path = row.get("image_path")
    if not image_path:
        raise HTTPException(status_code=404, detail={"code": "image_not_found", "message": "This record has no source image"})
    try:
        storage = SupabaseImageStorage(record_db.get_client())
        signed_url = storage.create_signed_url(image_path, SIGNED_IMAGE_TTL_SECONDS)
    except Exception as exc:
        logger.exception("Could not create a signed image URL for record %s", record_id)
        raise HTTPException(status_code=503, detail={"code": "image_unavailable", "message": "The source image is temporarily unavailable"}) from exc
    return SignedImageOut(signed_url=signed_url, expires_in=SIGNED_IMAGE_TTL_SECONDS)


@router.patch("/records/{record_id}", response_model=RecordOut)
def patch_record(record_id: UUID, patch: RecordPatch) -> RecordOut:
    """Update review-editable metadata on a record."""
    if record_db.get_record(record_id) is None:
        raise _not_found()
    row = record_db.update_record(record_id, patch.model_dump(exclude_unset=True, mode="json"))
    if row is None:
        raise _not_found()
    return _as_record_out(row)


@router.post("/records/{record_id}/approve", response_model=RecordOut)
def approve_record(record_id: UUID) -> RecordOut:
    """Approve only a record already in needs_review."""
    current = record_db.get_record(record_id)
    if current is None:
        raise _not_found()
    if current["status"] != RecordStatus.NEEDS_REVIEW.value:
        raise HTTPException(status_code=409, detail={"code": "invalid_record_state", "message": "Only records in needs_review can be approved"})
    row = record_db.set_status(record_id, RecordStatus.APPROVED.value, current.get("pipeline_stage"), None)
    if row is None:
        raise _not_found()
    return _as_record_out(row)


@router.post("/records/{record_id}/retry", status_code=status.HTTP_202_ACCEPTED)
def retry_record(record_id: UUID, background_tasks: BackgroundTasks) -> dict[str, str]:
    """Queue a failed record to resume at its persisted failed stage."""
    current = record_db.get_record(record_id)
    if current is None:
        raise _not_found()
    if current["status"] != RecordStatus.FAILED.value:
        raise HTTPException(status_code=409, detail={"code": "invalid_record_state", "message": "Only failed records can be retried"})
    from app.services.pipeline_runner import run_pipeline

    background_tasks.add_task(run_pipeline, record_id)
    return {"id": str(record_id), "status": "retry_queued"}


@router.get("/records")
def get_approved_records(
    bbox: Annotated[str | None, Query(description="west,south,east,north")]=None,
    type: Annotated[MonumentType | None, Query()]=None,
) -> dict[str, Any]:
    """Return approved records as a GeoJSON FeatureCollection."""
    parsed_bbox: tuple[float, float, float, float] | None = None
    if bbox is not None:
        try:
            values = tuple(float(part.strip()) for part in bbox.split(","))
            if len(values) != 4 or not (-180 <= values[0] <= 180 and -90 <= values[1] <= 90 and -180 <= values[2] <= 180 and -90 <= values[3] <= 90) or values[0] > values[2] or values[1] > values[3]:
                raise ValueError
            parsed_bbox = (values[0], values[1], values[2], values[3])
        except ValueError:
            raise HTTPException(status_code=422, detail={"code": "invalid_bbox", "message": "bbox must be west,south,east,north within WGS84 bounds"}) from None
    rows = record_db.list_approved(parsed_bbox, type.value if type else None)
    features: list[dict[str, Any]] = []
    for row in rows:
        point = row.get("location")
        coordinates = point.get("coordinates") if isinstance(point, dict) else None
        geometry = point if isinstance(point, dict) and point.get("type") == "Point" and isinstance(coordinates, list) and len(coordinates) == 2 else None
        properties = {key: value for key, value in row.items() if key not in {"location", "embedding"}}
        if geometry is not None:
            properties["lng"], properties["lat"] = coordinates
        features.append({"type": "Feature", "id": row["id"], "geometry": geometry, "properties": properties})
    return {"type": "FeatureCollection", "features": features}
