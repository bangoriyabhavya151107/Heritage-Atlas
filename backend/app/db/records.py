from typing import Any
from uuid import UUID

from supabase import Client, create_client

from app.core.config import get_settings


def get_client() -> Client:
    """Create a Supabase client using server-only environment credentials."""
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be configured")
    return create_client(settings.supabase_url, settings.supabase_service_key)


def create_record(payload: dict[str, Any], client: Client | None = None) -> dict[str, Any]:
    """Insert a new uploaded heritage record and return its database row."""
    db = client or get_client()
    response = db.table("heritage_records").insert(payload).execute()
    return response.data[0]


def get_record(record_id: UUID, client: Client | None = None) -> dict[str, Any] | None:
    """Fetch one record by UUID, returning None when it does not exist."""
    db = client or get_client()
    response = db.table("heritage_records").select("*").eq("id", str(record_id)).limit(1).execute()
    return response.data[0] if response.data else None


def update_record(record_id: UUID, values: dict[str, Any], client: Client | None = None) -> dict[str, Any] | None:
    """Update editable fields and return the resulting row."""
    db = client or get_client()
    response = db.table("heritage_records").update(values).eq("id", str(record_id)).execute()
    return response.data[0] if response.data else None


def list_approved(
    bbox: tuple[float, float, float, float] | None,
    type: str | None,
    client: Client | None = None,
) -> list[dict[str, Any]]:
    """List approved records, optionally restricted to a bbox and monument type."""
    db = client or get_client()
    query = db.table("heritage_records").select("*").eq("status", "approved")
    if type:
        query = query.eq("monument_type", type)
    if bbox:
        west, south, east, north = bbox
        polygon = f"SRID=4326;POLYGON(({west} {south},{east} {south},{east} {north},{west} {north},{west} {south}))"
        query = query.filter("location", "st_intersects", polygon)
    return query.execute().data


def match_records(
    query_embedding: list[float],
    match_count: int,
    client: Client | None = None,
) -> list[dict[str, Any]]:
    """Run the installed pgvector match_records RPC and return ranked candidates."""
    db = client or get_client()
    vector = "[" + ",".join(format(value, ".9g") for value in query_embedding) + "]"
    response = db.rpc(
        "match_records",
        {"query_embedding": vector, "match_count": max(0, match_count)},
    ).execute()
    return response.data


def get_records_by_ids(record_ids: list[str], client: Client | None = None) -> list[dict[str, Any]]:
    """Fetch full record rows for an already-ranked list of identifiers."""
    if not record_ids:
        return []
    db = client or get_client()
    return db.table("heritage_records").select("*").in_("id", record_ids).execute().data


def set_status(
    record_id: UUID,
    status: str,
    stage: str | None,
    error: str | None,
    client: Client | None = None,
) -> dict[str, Any] | None:
    """Set lifecycle status and associated pipeline diagnostics."""
    db = client or get_client()
    response = db.table("heritage_records").update(
        {"status": status, "pipeline_stage": stage, "error": error}
    ).eq("id", str(record_id)).execute()
    return response.data[0] if response.data else None
