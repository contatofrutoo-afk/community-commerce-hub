-- Add event info columns to event_registrations table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'event_name') THEN
    ALTER TABLE event_registrations ADD COLUMN event_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'event_date') THEN
    ALTER TABLE event_registrations ADD COLUMN event_date date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'event_time') THEN
    ALTER TABLE event_registrations ADD COLUMN event_time text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'location') THEN
    ALTER TABLE event_registrations ADD COLUMN location text;
  END IF;
END $$;