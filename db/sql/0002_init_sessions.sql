-- 0002_init_sessions.sql
-- Creates the sessions table used by src/hooks/usePresence.js and the
-- session-upsert path in src/hooks/useChat.js. A row exists for every
-- anonymous browser session that has ever opened the app.
--
-- session_id format: a UUID string emitted by crypto.randomUUID() and
-- persisted in localStorage under the key "session_id". Stored as TEXT
-- to match messages.session_id and avoid an implicit cast on join.

CREATE TABLE IF NOT EXISTS sessions (
  id        TEXT PRIMARY KEY,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  sessions           IS 'Anonymous browser sessions; one row per unique localStorage session_id';
COMMENT ON COLUMN sessions.id        IS 'Client-generated UUID (crypto.randomUUID) stored as TEXT';
COMMENT ON COLUMN sessions.last_seen IS 'Last upsert from the client; used by presence count';

CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON sessions (last_seen DESC);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Anon-key clients perform select/insert/update via upsert. Tightened
-- once /api owns this write path (architecture-update.md §3.1, #12).
DROP POLICY IF EXISTS "Allow public read access"   ON sessions;
DROP POLICY IF EXISTS "Allow public insert access" ON sessions;
DROP POLICY IF EXISTS "Allow public update access" ON sessions;

CREATE POLICY "Allow public read access"
  ON sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access"
  ON sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
