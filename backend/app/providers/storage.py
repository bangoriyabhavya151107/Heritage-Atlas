from typing import Protocol
from uuid import UUID

from supabase import Client


class ImageStorage(Protocol):
    """Interface for durable image object storage."""

    def upload(self, object_path: str, content: bytes, content_type: str) -> str:
        """Store image bytes and return the durable object path."""
        ...

    def download(self, object_path: str) -> bytes:
        """Retrieve bytes from private Storage for pipeline processing or retry."""
        ...

    def create_signed_url(self, object_path: str, expires_in: int) -> str:
        """Create a temporary access URL for an object in private storage."""
        ...


class SupabaseImageStorage:
    """Supabase Storage adapter for the private heritage-images bucket."""

    BUCKET = "heritage-images"

    def __init__(self, client: Client) -> None:
        self.client = client

    def upload(self, object_path: str, content: bytes, content_type: str) -> str:
        """Upload bytes without overwriting an existing object."""
        self.client.storage.from_(self.BUCKET).upload(
            path=object_path,
            file=content,
            file_options={"content-type": content_type, "upsert": "false"},
        )
        return object_path

    def download(self, object_path: str) -> bytes:
        """Download bytes from the private Storage bucket."""
        return self.client.storage.from_(self.BUCKET).download(object_path)

    def create_signed_url(self, object_path: str, expires_in: int) -> str:
        """Return the temporary signed URL while accepting SDK key casing variants."""
        response = self.client.storage.from_(self.BUCKET).create_signed_url(object_path, expires_in)
        signed_url = response.get("signedURL") or response.get("signedUrl")
        if not isinstance(signed_url, str) or not signed_url:
            raise RuntimeError("Supabase Storage did not return a signed image URL")
        return signed_url


def record_image_path(record_id: UUID, filename: str) -> str:
    """Create a collision-resistant bucket path using the record UUID."""
    suffix = filename.rsplit(".", maxsplit=1)[-1].lower()
    return f"{record_id}.{suffix}"
