-- Fix foreign key constraint for topic_messages to enable CASCADE DELETE
-- This allows deleting topics and automatically removing all related messages

ALTER TABLE topic_messages 
DROP CONSTRAINT IF EXISTS topic_messages_topic_id_fkey;

ALTER TABLE topic_messages
ADD CONSTRAINT topic_messages_topic_id_fkey
FOREIGN KEY (topic_id) 
REFERENCES topics(id) 
ON DELETE CASCADE;