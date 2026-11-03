-- Record provenance fields. Safe to re-run and compatible with databases that already applied 001_init.sql.
ALTER TABLE public.heritage_records ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.heritage_records ADD COLUMN IF NOT EXISTS source_title text;
ALTER TABLE public.heritage_records ADD COLUMN IF NOT EXISTS verification_notes text[] NOT NULL DEFAULT '{}';
