-- 0003_init_api_calls.sql
-- Creates the api_calls table used by src/hooks/useApiCalls.js to
-- enforce a 10-call-per-24h Gemini quota per anonymous session.
--
-- session_id is the upsert conflict target, so it carries the PRIMARY
-- KEY here. Per-session row count, so no foreign key to sessions —
-- the two tables are populated independently by different code paths.
--
-- NOTE: This is the *client-side* quota table. Server-side enforcement
-- (architecture-update.md §3 Phase 3, issue #12) will move this logic
-- into /api/_lib/rateLimiter.js with a service-role key; at that point
-- the RLS below is intended to be tightened so the anon key cannot
-- bypass quota by direct insert.

CREATE TABLE IF NOT EXISTS api_calls (
  session_id TEXT        PRIMARY KEY,
  call_count INTEGER     NOT NULL DEFAULT 0,
  last_reset TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  api_calls            IS 'Per-session Gemini call counter; resets after 24h since last_reset';
COMMENT ON COLUMN api_calls.session_id IS 'Anonymous session identifier (matches sessions.id)';
COMMENT ON COLUMN api_calls.call_count IS 'Number of calls made in the current 24h window';
COMMENT ON COLUMN api_calls.last_reset IS 'Window start; useApiCalls resets to 0 when NOW() - last_reset > 24h';

ALTER TABLE api_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access"   ON api_calls;
DROP POLICY IF EXISTS "Allow public insert access" ON api_calls;
DROP POLICY IF EXISTS "Allow public update access" ON api_calls;

CREATE POLICY "Allow public read access"
  ON api_calls
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access"
  ON api_calls
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON api_calls
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
