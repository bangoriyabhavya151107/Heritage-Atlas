#!/usr/bin/env python3
"""Seed five curated demo records using stable IDs and a real Gemini embedding provider.

Default behavior is a local-only dry run. Pass --apply only after configuring a Supabase
project and confirming the Google AI project remains on the free tier.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any
from uuid import NAMESPACE_URL, uuid5

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.core.config import Settings  # noqa: E402
from app.providers.gemini import GeminiProvider  # noqa: E402
from supabase import create_client  # noqa: E402

RECORDS_PATH = ROOT / "seed" / "records.json"
EXPECTED_SEED_COUNT = 5
EXPECTED_GENERATION_MODEL = "gemini-3.8-flash"
EXPECTED_EMBEDDING_MODEL = "gemini-embedding-2"
EXPECTED_EMBEDDING_DIMENSIONS = 768
MAX_SEARCH_DOCUMENT_CHARACTERS = 2000


def deterministic_id(seed_key: str) -> str:
    """Return the same UUID for a seed key on every run."""
    return str(uuid5(NAMESPACE_URL, f"heritage-atlas:demo-seed:{seed_key}"))


def search_document(record: dict[str, Any]) -> str:
    """Match the stable field order used by the production embedding pipeline."""
    fields = [
        record.get("title") or "",
        record.get("monument_type") or "",
        record.get("period") or "",
        ", ".join(record.get("materials") or []),
        ", ".join(record.get("features") or []),
        record.get("summary") or "",
        record.get("english_text") or "",
    ]
    document = " ".join(value for value in fields if value).strip()
    if not document:
        document = f"Heritage record at {record.get('place_name') or ''}".strip()
    return document[:MAX_SEARCH_DOCUMENT_CHARACTERS]


def load_records() -> list[dict[str, Any]]:
    """Load and validate the curated JSON manifest without contacting providers."""
    records = json.loads(RECORDS_PATH.read_text(encoding="utf-8"))
    if not isinstance(records, list) or len(records) != EXPECTED_SEED_COUNT:
        raise ValueError(f"Expected exactly {EXPECTED_SEED_COUNT} seed records in {RECORDS_PATH}")
    keys: set[str] = set()
    for record in records:
        required = ("seed_key", "title", "monument_type", "summary", "place_name", "source", "image_path")
        if any(not record.get(field) for field in required):
            raise ValueError(f"Seed row is missing one or more required fields: {record.get('seed_key', '<unknown>')}")
        if record["seed_key"] in keys:
            raise ValueError(f"Duplicate seed_key: {record['seed_key']}")
        keys.add(record["seed_key"])
        if record["image_path"] != f"seed-images/{record['seed_key']}.jpg":
            raise ValueError(f"Unexpected placeholder image path for {record['seed_key']}")
        lat, lng = record.get("lat"), record.get("lng")
        if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)):
            raise ValueError(f"Seed record {record['seed_key']} needs numeric map coordinates")
        if not (20 <= lat <= 25 and 68 <= lng <= 75):
            raise ValueError(f"Seed record {record['seed_key']} coordinates are outside the Gujarat bounds")
        if not record.get("source_title") or not record.get("verified_facts") or not record.get("unverified"):
            raise ValueError(f"Seed record {record['seed_key']} needs source, verified facts, and uncertainty notes")
    return records


def build_payloads(records: list[dict[str, Any]], provider: GeminiProvider) -> list[dict[str, Any]]:
    """Generate all embeddings first so a provider failure cannot partially write the batch."""
    payloads: list[dict[str, Any]] = []
    for record in records:
        embedding = provider.embed(search_document(record))
        if len(embedding) != EXPECTED_EMBEDDING_DIMENSIONS:
            raise ValueError(f"Gemini returned {len(embedding)} dimensions for {record['seed_key']}; expected 768")
        payloads.append({
            "id": deterministic_id(record["seed_key"]),
            "title": record["title"],
            "monument_type": record["monument_type"],
            "period": record.get("period"),
            "materials": record.get("materials") or [],
            "features": record.get("features") or [],
            "language": record.get("language"),
            "original_text": record.get("original_text"),
            "english_text": record.get("english_text"),
            "summary": record["summary"],
            "image_path": record["image_path"],
            "source_url": record["source"],
            "source_title": record["source_title"],
            "verification_notes": record["unverified"],
            "place_name": record["place_name"],
            "region": record.get("region"),
        "location": f"SRID=4326;POINT({record['lng']} {record['lat']})",
            "status": "approved",
            "pipeline_stage": "complete",
            "error": None,
            "warning": None,
            "embedding": embedding,
        })
        print(f"Prepared {record['seed_key']} ({len(embedding)} embedding dimensions)")
    return payloads


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="call Gemini embeddings and upsert the five deterministic IDs into Supabase")
    args = parser.parse_args()

    records = load_records()
    if not args.apply:
        print("DRY RUN — no Gemini or Supabase requests were made.")
        for record in records:
            print(f"{deterministic_id(record['seed_key'])}  {record['seed_key']}: {record['title']}  [{record['source']}]")
        print("Review seed/records.json, configure the documented free-tier services, then rerun with --apply.")
        return 0

    settings = Settings()
    if settings.ai_provider != "gemini":
        raise SystemExit("Refusing to seed: AI_PROVIDER must be gemini; fake providers are test-only.")
    if settings.gemini_model != EXPECTED_GENERATION_MODEL or settings.embedding_model != EXPECTED_EMBEDDING_MODEL:
        raise SystemExit(
            "Refusing to seed with unverified models. Set GEMINI_MODEL=gemini-3.8-flash and "
            "EMBEDDING_MODEL=gemini-embedding-2, then verify today's free-tier terms before applying."
        )
    if settings.embedding_dim != EXPECTED_EMBEDDING_DIMENSIONS:
        raise SystemExit("Refusing to seed: EMBEDDING_DIM must be 768 to match the database schema.")
    missing = [name for name, value in (
        ("SUPABASE_URL", settings.supabase_url),
        ("SUPABASE_SERVICE_KEY", settings.supabase_service_key),
        ("GEMINI_API_KEY", settings.gemini_api_key),
    ) if not value]
    if missing:
        raise SystemExit("Refusing to seed; configure these server-only variables first: " + ", ".join(missing))

    print("Applying five curated records using the real Gemini API. No image files are uploaded by this script.")
    provider = GeminiProvider()
    payloads = build_payloads(records, provider)
    client = create_client(settings.supabase_url, settings.supabase_service_key)
    response = client.table("heritage_records").upsert(payloads, on_conflict="id").execute()
    count = len(response.data or [])
    if count != EXPECTED_SEED_COUNT:
        raise RuntimeError(f"Supabase returned {count} rows after upserting {EXPECTED_SEED_COUNT} seed records")
    print(f"Upserted {count} records. Stable seed IDs make this operation idempotent.")
    print("Upload authorized images separately to the private heritage-images bucket at the paths listed in seed/records.json.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
