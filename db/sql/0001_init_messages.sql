-- 0001_init_messages.sql
-- Creates the messages table backing the public chat feature, along with
-- its indexes and Row Level Security policies. Realtime publication is
-- handled separately in 0004_realtime_publications.sql so that all
-- realtime configuration lives in one place.

CREATE TABLE IF NOT EXISTS messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  messages              IS 'Public chat messages, one row per sent message';
COMMENT ON COLUMN messages.id           IS 'Unique message identifier';
COMMENT ON COLUMN messages.session_id   IS 'Anonymous session identifier (matches sessions.id)';
COMMENT ON COLUMN messages.content      IS 'Message text body';
COMMENT ON COLUMN messages.created_at   IS 'Server-side insert time';

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages (session_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access"   ON messages;
DROP POLICY IF EXISTS "Allow public insert access" ON messages;

CREATE POLICY "Allow public read access"
  ON messages
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access"
  ON messages
  FOR INSERT
  WITH CHECK (true);
