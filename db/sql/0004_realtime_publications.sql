-- 0004_realtime_publications.sql
-- Adds the messages table to the supabase_realtime publication so the
-- chat hook (src/hooks/useChat.js) receives INSERTs over WebSocket.
--
-- ALTER PUBLICATION ... ADD TABLE has no IF NOT EXISTS form, so we
-- guard with a catalog lookup to keep the migration idempotent.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_publication_tables
    WHERE  pubname    = 'supabase_realtime'
      AND  schemaname = 'public'
      AND  tablename  = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END
$$;
