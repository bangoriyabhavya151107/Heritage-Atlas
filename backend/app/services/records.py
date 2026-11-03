from typing import Any
from uuid import uuid4

from app.db import records as record_db
from app.providers.storage import ImageStorage, record_image_path


def create_uploaded_record(content: bytes, filename: str, content_type: str, place_name: str, lat: float, lng: float, storage: ImageStorage) -> dict[str, Any]:
    """Store an image and create its uploaded database record."""
    record_id = uuid4()
    object_path = record_image_path(record_id, filename)
    storage.upload(object_path, content, content_type)
    return record_db.create_record({
        "id": str(record_id),
        "place_name": place_name,
          "location": f"SRID=4326;POINT({lng} {lat})",
        "image_path": object_path,
        "status": "uploaded",
        "pipeline_stage": "uploaded",
    })
