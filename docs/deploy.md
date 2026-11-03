# Deployment

## Prerequisites

1. Apply `supabase/migrations/001_init.sql` and `002_record_citations.sql`.
2. Create the private `heritage-images` Storage bucket.
3. Confirm the intended Gemini project and free-tier limits before using real AI calls.

## Render backend

1. Push the repository to a Git provider and create a Render Blueprint from `render.yaml`, or create a Docker web service using the repository `Dockerfile`.
2. Set the environment variables listed in `render.yaml`. Keep `SUPABASE_SERVICE_KEY` and `GEMINI_API_KEY` server-side. Set `CORS_ORIGINS` to the exact deployed Vercel origin, for example `https://heritage-atlas.example`, with no trailing slash.
3. Deploy and check `https://<render-host>/health`; it should return `{ "status": "ok" }`.
4. The Docker image installs Tesseract English, Hindi, and Gujarati data. The backend listens on Render's expected port 8000.

The background pipeline is process-local in this prototype. For durable work, move it to a queue and dedicated workers before relying on production delivery guarantees.

## Vercel frontend

1. Import the same repository into Vercel and set the project root to `frontend`.
2. Use the package manager from `package.json` (`pnpm`) and build command `pnpm build`.
3. Set `NEXT_PUBLIC_API_URL` to the deployed Render API URL, for example `https://heritage-atlas-api.onrender.com`. Set `NEXT_PUBLIC_OSM_TILE_URL` to the OpenStreetMap tile template if overriding the default.
4. Redeploy after setting variables. Add the final Vercel origin to backend `CORS_ORIGINS` and redeploy the backend.
5. Verify upload-page validation, the Explore map, search, and the public credits page. A real upload also requires valid Supabase/Gemini configuration.

Never put Supabase service credentials or `GEMINI_API_KEY` in `NEXT_PUBLIC_*` variables.
