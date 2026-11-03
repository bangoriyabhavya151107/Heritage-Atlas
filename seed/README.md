# Curated Gujarat demo records

`records.json` contains exactly five conservative example records. Each item carries a source URL and title, a short set of source-backed `verified_facts`, and a `unverified` list for claims or coordinates that should not be presented as settled. The public Explore detail card shows the cited source and unresolved notes after the seed script has been applied.

## Evidence and boundaries

| Seed key | Primary listing | Conservative scope |
|---|---|---|
| `adalaj-stepwell` | [Gujarat Tourism — Adalaj Ni Vav](https://gujarattourism.com/central-zone/gandhinagar/adalaj-ni-vav.html) | 15th-century listing, five storeys, three entrances, octagonal opening, Indo-Islamic fusion and carvings. The listing does not specify an exact year. Materials are left blank because it does not establish the whole structure's composition. |
| `rani-ki-vav` | [UNESCO World Heritage Centre — Rani-ki-Vav](https://whc.unesco.org/en/list/922/) | 11th-century site, inverted-temple design and seven stair levels. The source does not establish the exact construction year, king's identity or materials. |
| `modhera-sun-temple` | [UNESCO Tentative List — Sun Temple, Modhera](https://whc.unesco.org/en/tentativelists/6627/) | 11th-century, style-based dating; east-facing, bright yellow sandstone complex. The exact construction year is not asserted. |
| `sidi-saiyyed-mosque` | [Gujarat Tourism — Siddi Sayed Mosque](https://gujarattourism.com/central-zone/ahmedabad/siddi-sayed-mosque.html) | 1572–73 CE, tree-of-life jali windows and continued use for prayer. Materials are left blank because the cited page does not state them. |
| `lothal` | [UNESCO Tentative List — Lothal](https://whc.unesco.org/en/tentativelists/5918/) | Harappan culture range as stated in the entry, upper/lower town and a basin interpreted as a tidal dockyard. Lothal is listed on UNESCO's Tentative List; do not describe it as an inscribed World Heritage property on this basis. |

Map pins are approximate map-placement coordinates, not surveyed boundaries. The listed periods describe the source's broad attribution, not precise construction dates where the source does not provide one. Empty material arrays are deliberate. See `unverified` on each JSON item for item-specific caveats.

## Source-image placeholders

The manifest uses placeholder object paths such as `seed-images/adalaj-stepwell.jpg`. The seed script **does not** download or upload any photos. Until a researcher supplies an authorized image, the detail panel will show that the source image is unavailable.

To add a real, authorized photo, upload it to the project's **private** Supabase Storage bucket named `heritage-images` at the exact object path in that record's `image_path`, e.g. `seed-images/adalaj-stepwell.jpg`. Keep the bucket private. Do not put source photos in the public frontend directory or use an image without permission. The landing page has a separate Wikimedia Commons image with a visible CC BY-SA 4.0 attribution on `/credits`.

## Safe, repeatable seed

The script defaults to a local dry run and makes no Gemini or Supabase calls:

```bash
python3 scripts/seed_demo_records.py
```

For an actual seed, first apply `supabase/migrations/001_init.sql` and `supabase/migrations/002_record_citations.sql` (the second adds citation fields to databases that already applied the initial schema), create a **private** `heritage-images` bucket, and configure server-only `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.8-flash`, `EMBEDDING_MODEL=gemini-embedding-2`, `EMBEDDING_DIM=768`, and `AI_PROVIDER=gemini` in the root `.env`. Never put those credentials in frontend or `NEXT_PUBLIC_*` variables.

The script sends five sequential embedding requests to the real Gemini API, checks for exactly 768 dimensions, then performs one Supabase upsert. Stable UUIDv5 IDs make reruns update the same five seed rows rather than create duplicates; unrelated user-created rows are not selected or modified. A provider failure before the final upsert writes no partial batch. No fake provider is used by the script.

Only run with `--apply` after independently confirming that the Google AI project is on the Free tier and that the current model IDs, quota and pricing still meet the no-paid-API requirement:

```bash
python3 scripts/seed_demo_records.py --apply
```

As checked against Google's pricing page on 2026-11-02, both configured models listed text input as free of charge on the Free tier. Google also states Free-tier content may be used to improve its products. The script cannot detect whether an account has been upgraded to a paid billing tier; if that cannot be ruled out, do not run `--apply`. Never upgrade the project to complete this demo.
