# Heritage Atlas — pitch outline

## Slide 1 — Problem
- Student field evidence lives in photos, Gujarati/Hindi notes, slide decks, and cloud folders.
- Researchers cannot reliably search “stepwells with carved pillars”.
- Place, source, and context get separated.

## Slide 2 — Solution
- Upload one scan/photo, place it on a map, and get a structured draft.
- Keep source image, OCR, suggested fields, citations, and location together.
- A human reviews and approves before public discovery.

## Slide 3 — Demo flow
- Upload JPEG/PNG/WebP and choose place plus map point.
- Watch the processing stepper and polling review page.
- Edit, approve, open the map/detail panel, then run semantic search.

## Slide 4 — Architecture
- Next.js frontend → FastAPI routers → services → pipeline → providers → Supabase.
- Tesseract handles OCR; Gemini handles extraction, translation, and embeddings.
- Private Storage keeps uploaded source images private.

## Slide 5 — Database schema
- `heritage_records`: metadata, OCR/translation, citations, status, location, embedding.
- PostGIS geography point for map filtering.
- GiST location, HNSW embedding, B-tree status and monument type.

## Slide 6 — Tech stack
- Next.js, React, TypeScript, Tailwind, Leaflet/OpenStreetMap.
- FastAPI, Pydantic, pytest, Ruff-compatible Python tooling.
- Supabase Postgres/PostGIS/pgvector/Storage; deterministic fake provider in tests.

## Slide 7 — Scalability
- 10×: durable Celery/Redis queue, separate workers, retry limits, caching.
- 100×: stage-specific pools, CDN/transforms, read replicas, batch import.
- Keep idempotency, provenance, rate-limit backoff, and private originals.

## Slide 8 — Limitations
- Handwriting, damaged pages, and old scripts challenge OCR.
- Free-tier quotas and model availability can change.
- AI can hallucinate; review is mandatory. Seed images are placeholders.
- No 3D, auth, or payments; process-local background work.

## Slide 9 — Roadmap
- Durable workers and observability.
- Better provenance, confidence review, and citations.
- Batch import, deletion/retention controls, more languages.
- Consider richer media after the core workflow is reliable.

## Slide 10 — Team
- Bhavya — product and heritage workflow.
- Purv — backend, pipeline, and data model.
- Jay — frontend, map, and demo experience.
- Heritage Atlas: evidence first, human-reviewed, place-aware.
