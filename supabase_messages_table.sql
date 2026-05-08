-- ============================================
-- Supabase Messages Table Setup
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- to create the messages table for the chat feature
-- ============================================

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE messages IS 'Stores chat messages for real-time chat feature';

-- Add comments to columns
COMMENT ON COLUMN messages.id IS 'Unique message identifier';
COMMENT ON COLUMN messages.session_id IS 'User session identifier from localStorage';
COMMENT ON COLUMN messages.content IS 'Message text content';
COMMENT ON COLUMN messages.created_at IS 'Timestamp when message was created';

-- Create index for performance (most recent messages first)
CREATE INDEX IF NOT EXISTS idx_messages_created_at 
ON messages(created_at DESC);

-- Create index for session_id lookups
CREATE INDEX IF NOT EXISTS idx_messages_session_id 
ON messages(session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read messages (public chat)
CREATE POLICY "Allow public read access" 
ON messages 
FOR SELECT 
USING (true);

-- Policy: Allow anyone to insert messages (public chat)
CREATE POLICY "Allow public insert access" 
ON messages 
FOR INSERT 
WITH CHECK (true);

-- Optional: Policy to allow users to delete their own messages
-- Uncomment if you want users to be able to delete their messages
-- CREATE POLICY "Allow users to delete own messages" 
-- ON messages 
-- FOR DELETE 
-- USING (session_id = current_setting('request.jwt.claims', true)::json->>'session_id');

-- Enable real-time for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================
-- Verification Queries
-- ============================================

-- Check if table was created successfully
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_name = 'messages';

-- Check columns
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages';

-- Check indexes
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'messages';

-- Check RLS policies
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE tablename = 'messages';

-- ============================================
-- Test Data (Optional)
-- ============================================

-- Insert a test message
-- INSERT INTO messages (session_id, content) 
-- VALUES ('test-session-123', 'Hello, this is a test message!');

-- Query all messages
-- SELECT * FROM messages ORDER BY created_at DESC LIMIT 10;

-- ============================================
-- Cleanup (Use with caution!)
-- ============================================

-- Drop table and all data (DESTRUCTIVE!)
-- DROP TABLE IF EXISTS messages CASCADE;

-- ============================================
-- Notes
-- ============================================

-- 1. Real-time subscriptions require the table to be added to supabase_realtime publication
-- 2. RLS policies are set to allow public access - modify for production use
-- 3. Consider adding rate limiting on the application side
-- 4. Monitor table size and implement cleanup/archival strategy for old messages
-- 5. For production, consider adding:
--    - Message moderation flags
--    - User authentication
--    - Message edit/delete timestamps
--    - Read receipts
--    - Typing indicators table

-- ============================================
-- Production Recommendations
-- ============================================

-- 1. Implement proper authentication
-- 2. Add rate limiting (e.g., max 10 messages per minute per session)
-- 3. Add content moderation
-- 4. Set up automated cleanup of old messages (e.g., delete after 30 days)
-- 5. Monitor database size and performance
-- 6. Add message length validation (e.g., max 1000 characters)
-- 7. Consider adding a 'deleted_at' column for soft deletes
-- 8. Add indexes for common query patterns

-- Example: Add message length constraint
-- ALTER TABLE messages ADD CONSTRAINT message_length_check 
-- CHECK (char_length(content) > 0 AND char_length(content) <= 1000);

-- Example: Add soft delete column
-- ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Example: Automated cleanup function (run daily via pg_cron)
-- CREATE OR REPLACE FUNCTION cleanup_old_messages()
-- RETURNS void AS $$
-- BEGIN
--   DELETE FROM messages 
--   WHERE created_at < NOW() - INTERVAL '30 days';
-- END;
-- $$ LANGUAGE plpgsql;
