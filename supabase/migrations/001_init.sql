-- Heritage Atlas schema. `ADD COLUMN IF NOT EXISTS` keeps this migration safe to re-run.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.heritage_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    title text,
    monument_type text CHECK (monument_type IS NULL OR monument_type IN ('stepwell','fort','temple','mosque','craft','other')),
    period text,
    materials text[] NOT NULL DEFAULT '{}',
    features text[] NOT NULL DEFAULT '{}',
    language text,
    original_text text,
    english_text text,
    summary text,
    image_path text,
    source_url text,
    source_title text,
    verification_notes text[] NOT NULL DEFAULT '{}',
    place_name text,
    region text,
    location geography(Point,4326),
    status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','processing','needs_review','approved','failed')),
    pipeline_stage text,
    error text,
    warning text,
    ocr_confidence double precision CHECK (ocr_confidence IS NULL OR (ocr_confidence >= 0 AND ocr_confidence <= 100)),
    embedding vector(768)
);

ALTER TABLE public.heritage_records ADD COLUMN IF NOT EXISTS warning text;
ALTER TABLE public.heritage_records ADD COLUMN IF NOT EXISTS ocr_confidence double precision;
ALTER TABLE public.heritage_records ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.heritage_records ADD COLUMN IF NOT EXISTS source_title text;
ALTER TABLE public.heritage_records ADD COLUMN IF NOT EXISTS verification_notes text[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.set_heritage_records_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS heritage_records_updated_at ON public.heritage_records;
CREATE TRIGGER heritage_records_updated_at
BEFORE UPDATE ON public.heritage_records
FOR EACH ROW EXECUTE FUNCTION public.set_heritage_records_updated_at();

-- GiST accelerates spatial predicates and bounding-box filtering on geography.
CREATE INDEX IF NOT EXISTS heritage_records_location_gist ON public.heritage_records USING gist (location);
-- HNSW accelerates approximate nearest-neighbor cosine-distance searches over embeddings.
CREATE INDEX IF NOT EXISTS heritage_records_embedding_hnsw ON public.heritage_records USING hnsw (embedding vector_cosine_ops);
-- B-tree accelerates exact status filters used by review and approval workflows.
CREATE INDEX IF NOT EXISTS heritage_records_status_btree ON public.heritage_records USING btree (status);
-- B-tree accelerates exact monument-type filters used by Explore.
CREATE INDEX IF NOT EXISTS heritage_records_monument_type_btree ON public.heritage_records USING btree (monument_type);

CREATE OR REPLACE FUNCTION public.match_records(query_embedding vector(768), match_count int)
RETURNS TABLE (
    id uuid,
    title text,
    monument_type text,
    period text,
    summary text,
    place_name text,
    region text,
    location geography(Point,4326),
    similarity double precision
)
LANGUAGE sql STABLE
AS $$
    SELECT r.id, r.title, r.monument_type, r.period, r.summary, r.place_name, r.region,
           r.location, 1 - (r.embedding <=> query_embedding) AS similarity
    FROM public.heritage_records AS r
    WHERE r.status = 'approved' AND r.embedding IS NOT NULL
    ORDER BY r.embedding <=> query_embedding
    LIMIT greatest(match_count, 0);
$$;

-- Storage setup (Dashboard, not SQL): create private bucket "heritage-images".
