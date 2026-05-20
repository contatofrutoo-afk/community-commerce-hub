ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_post_id_fkey;

ALTER TABLE event_registrations
ADD CONSTRAINT event_registrations_post_id_fkey
FOREIGN KEY (post_id)
REFERENCES posts(id)
ON DELETE CASCADE;
