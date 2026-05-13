-- 0005_init_subjects.sql
-- Creates the subjects table — one row per top-level academic subject
-- the app teaches (e.g. "IT", "Economics", "Social Studies"). Acts as
-- the parent reference for future per-subject content tables (lessons,
-- topics, progress, etc.) which will FK to subjects.id.
--
-- Writes are admin-only: this table is small, hand-curated, and must
-- not be mutated by client traffic. The pattern matches
-- architecture-update.md §3.1 — RLS denies writes from the anon and
-- authenticated roles; mutations happen from /api/ using a
-- service-role Supabase client (service_role bypasses RLS).

CREATE TABLE IF NOT EXISTS subjects (
  id          SERIAL      PRIMARY KEY,
  name        TEXT        NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  subjects             IS 'Top-level academic subjects the app teaches; admin-curated';
COMMENT ON COLUMN subjects.id          IS 'Surrogate key referenced by future per-subject content tables';
COMMENT ON COLUMN subjects.name        IS 'Display name, unique (e.g. "IT", "Economics")';
COMMENT ON COLUMN subjects.description IS 'Optional one-line summary shown in subject pickers';
COMMENT ON COLUMN subjects.created_at  IS 'Row insertion time';

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON subjects;

-- Public read: every visitor can list subjects to populate UI menus.
CREATE POLICY "Allow public read access"
  ON subjects
  FOR SELECT
  USING (true);

-- Intentionally no INSERT / UPDATE / DELETE policies for anon or
-- authenticated. Writes go through /api/ with the service-role key.