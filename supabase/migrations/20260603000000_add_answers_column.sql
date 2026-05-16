-- Adicionar coluna answers se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_registrations' AND column_name = 'answers'
  ) THEN
    ALTER TABLE event_registrations ADD COLUMN answers jsonb DEFAULT '{}';
  END IF;
END
$$;