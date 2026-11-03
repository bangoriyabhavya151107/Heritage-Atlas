# Project status

## Done

- FastAPI record upload, validation, background pipeline, checkpointing, retry, review patching, approval, GeoJSON map listing, and semantic search.
- Next.js upload, processing stepper, review editor, Explore map/search, detail panel, credits, privacy, and terms pages.
- Supabase migrations 001 and 002, private-image signed URL endpoint, curated five-record seed manifest, and deterministic fake-provider tests.
- README, pitch outline, demo script, CI workflow, Render/Vercel deployment notes, and compressed attributed landing image.
- Removed the unused Manus app config and route manifest; kept only the local dev origin in `frontend/next.config.ts`.

## Not yet tested in this session

- No Supabase or Gemini calls were made; no live app or seed apply was run.
- Render and Vercel deployments were not executed.
- Dependency installation and backend/frontend checks depend on the available network/toolchain and should be run on the submission machine.
- The live upload-to-processing-to-approval flow still requires external Supabase/Gemini configuration.
