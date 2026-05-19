-- Add updated_at and deleted_at columns to messages table for edit/delete feature
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create RLS policy for message updates (author only)
DROP POLICY IF EXISTS "Allow author to update own messages" ON messages;

CREATE POLICY "Allow author to update own messages"
ON messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid());

-- Create RLS policy for message deletes (author only)
DROP POLICY IF EXISTS "Allow author to delete own messages" ON messages;

CREATE POLICY "Allow author to delete own messages"
ON messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid());