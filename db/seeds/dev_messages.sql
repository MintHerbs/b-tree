-- dev_messages.sql
-- Optional sample chat history for local development. Not part of the
-- migration manifest — load by hand when you want a non-empty chat
-- panel to look at.
--
-- Idempotent on re-run: each row has a stable id.

INSERT INTO messages (id, session_id, content, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'dev-seed-alice', 'hi from alice',     NOW() - INTERVAL '10 minutes'),
  ('00000000-0000-0000-0000-000000000002', 'dev-seed-bob',   'hi from bob',       NOW() - INTERVAL  '9 minutes'),
  ('00000000-0000-0000-0000-000000000003', 'dev-seed-alice', 'how is the demo?',  NOW() - INTERVAL  '8 minutes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sessions (id, last_seen) VALUES
  ('dev-seed-alice', NOW()),
  ('dev-seed-bob',   NOW())
ON CONFLICT (id) DO UPDATE SET last_seen = EXCLUDED.last_seen;
