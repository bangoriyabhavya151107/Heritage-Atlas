# Heritage Atlas — frontend

This is the Phase 3 web interface in `frontend/`. The repository also contains the FastAPI backend, Supabase migration, and backend documentation at the project root.

## Scope

The requested screens are Upload (`/upload`), Review (`/records/[id]/review`), and Explore (`/explore`). Upload includes the location picker; Explore is deliberately a clear placeholder in this phase—there is no Explore map or semantic-search UI. The Review image area is also an explicit placeholder: the source image stays in the private `heritage-images` bucket, and the browser does not receive a public object URL or signed URL.

## Decisions (and alternatives considered)

- **Typed API boundary:** `src/lib/api.ts` is the only HTTP entry point for components. Zod validates requests and responses against the Pydantic contracts, and `ApiError` turns transport/server failures into short user-facing messages; this avoids scattered `fetch` calls and unsafe casts.
- **Leaflet only on Upload:** `LocationPicker` dynamically imports the map with `ssr: false` in a Client Component. Leaflet reads browser layout state, so eager server rendering was rejected; the Explore screen remains map-free until that phase is requested.
- **OpenStreetMap tiles:** the picker uses the standard free raster tile service and displays required attribution. A paid tile-provider key was rejected; respect the OSM tile-use policy and avoid automated high-volume requests.
- **Private image placeholder:** the review page clearly says why the source image cannot be previewed. Making the bucket public was rejected to protect uploaded material; no signed-URL endpoint was added, per the team's choice.
- **Tailwind v3 config:** exact palette/font tokens live in `tailwind.config.js`, as requested. The CSS-first Tailwind v4 configuration was rejected because it would not provide that requested config-file home.
- **Local editor state:** `RecordEditor` owns its draft after the record loads and only mirrors safe edits optimistically; the old record is restored if PATCH fails. Initializing via an effect was rejected because it causes an avoidable render and can overwrite active typing.

## Run the frontend

Use Node.js 22 and the pinned pnpm version shown in `package.json`. From this directory:

```bash
cp -n .env.example .env.local
pnpm install --frozen-lockfile
npm run dev
```

`NEXT_PUBLIC_API_URL` is public configuration, not a secret. The example points to `http://127.0.0.1:8000`. Edit `frontend/.env.local` if your FastAPI server uses another URL; restart Next.js after changing it. The OSM tile URL has a free default and can be overridden with `NEXT_PUBLIC_OSM_TILE_URL`.

Open `http://localhost:3000/upload`. Allow browser location access to use the location button, or click the map to set the pin. A browser permission error is shown inline; it does not prevent map selection.

## Backend prerequisites for the full flow

Run the backend using the repository-root instructions in [`docs/architecture.md`](../docs/architecture.md). Apply `supabase/migrations/001_init.sql`, create the `heritage-images` bucket as **private** in the Supabase dashboard, configure the backend environment, and set its CORS origins to include the browser origin. No secrets belong in this frontend or its public `NEXT_PUBLIC_*` variables. The checked-in `AI_PROVIDER=fake` default makes no Gemini calls; record/storage persistence still requires Supabase. Set `AI_PROVIDER=gemini` only after checking the current account/model free quota; see [`docs/model-verification.md`](../docs/model-verification.md).

## Checks

Run from `frontend/`:

```bash
npm run lint
npm run typecheck
npm run build
```

The route manifest is served as JSON at `/manus-routes.json`; it lists `/`, `/upload`, `/explore`, and `/records/:id/review`. `/` redirects to Upload.
