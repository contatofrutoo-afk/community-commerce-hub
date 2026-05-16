-- Criar tabela event_registrations se não existir
CREATE TABLE IF NOT EXISTS event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES event_cta(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id),
  tenant_id uuid REFERENCES tenants(id),
  user_id uuid REFERENCES auth.users(id),
  name text,
  email text,
  phone text,
  notes text,
  answers jsonb DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Adicionar columns que podem não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'event_id') THEN
    ALTER TABLE event_registrations ADD COLUMN event_id uuid REFERENCES event_cta(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'post_id') THEN
    ALTER TABLE event_registrations ADD COLUMN post_id uuid REFERENCES posts(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'tenant_id') THEN
    ALTER TABLE event_registrations ADD COLUMN tenant_id uuid REFERENCES tenants(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'user_id') THEN
    ALTER TABLE event_registrations ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'name') THEN
    ALTER TABLE event_registrations ADD COLUMN name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'email') THEN
    ALTER TABLE event_registrations ADD COLUMN email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'phone') THEN
    ALTER TABLE event_registrations ADD COLUMN phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'notes') THEN
    ALTER TABLE event_registrations ADD COLUMN notes text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'answers') THEN
    ALTER TABLE event_registrations ADD COLUMN answers jsonb DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'status') THEN
    ALTER TABLE event_registrations ADD COLUMN status text DEFAULT 'pending';
  END IF;
END $$;

-- Recriar constraint unique se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_event_user_registration'
  ) THEN
    ALTER TABLE event_registrations
    ADD CONSTRAINT unique_event_user_registration UNIQUE (event_id, user_id);
  END IF;
END $$;

-- Recriar RLS policies
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can create event_registrations" ON event_registrations;
CREATE POLICY "Authenticated users can create event_registrations"
ON event_registrations FOR INSERT
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "B2B owners can view event_registrations" ON event_registrations;
CREATE POLICY "B2B owners can view event_registrations"
ON event_registrations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE memberships.tenant_id = event_registrations.tenant_id
    AND memberships.user_id = auth.uid()
    AND memberships.role IN ('owner', 'admin')
  )
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "B2B owners can update event_registrations" ON event_registrations;
CREATE POLICY "B2B owners can update event_registrations"
ON event_registrations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE memberships.tenant_id = event_registrations.tenant_id
    AND memberships.user_id = auth.uid()
    AND memberships.role IN ('owner', 'admin')
  )
);

-- Recriar índices
DROP INDEX IF EXISTS idx_event_registrations_event;
DROP INDEX IF EXISTS idx_event_registrations_user;
DROP INDEX IF EXISTS idx_event_registrations_tenant;

CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_tenant ON event_registrations(tenant_id);