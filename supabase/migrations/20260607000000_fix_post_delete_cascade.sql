-- Fix appointment_requests post_id constraint to allow CASCADE delete
-- This allows posts to be deleted without foreign key violation errors

ALTER TABLE appointment_requests DROP CONSTRAINT IF EXISTS appointment_requests_post_id_fkey;

ALTER TABLE appointment_requests
ADD CONSTRAINT appointment_requests_post_id_fkey
FOREIGN KEY (post_id)
REFERENCES posts(id)
ON DELETE CASCADE;

-- Also fix event_registrations post_id constraint (same issue)
ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_post_id_fkey;

ALTER TABLE event_registrations
ADD CONSTRAINT event_registrations_post_id_fkey
FOREIGN KEY (post_id)
REFERENCES posts(id)
ON DELETE CASCADE;