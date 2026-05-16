-- Tabela de agendamentos CTA
CREATE TABLE IF NOT EXISTS appointment_cta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id),
  service_name text NOT NULL,
  duration_minutes integer NOT NULL,
  service_date date NOT NULL,
  available_times jsonb NOT NULL DEFAULT '[]',
  notes text,
  max_bookings integer DEFAULT 1,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Tabela de solicitações de agendamento
CREATE TABLE IF NOT EXISTS appointment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointment_cta(id),
  post_id uuid REFERENCES posts(id),
  tenant_id uuid REFERENCES tenants(id),
  user_id uuid REFERENCES auth.users(id),
  selected_time text,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Constraint para evitar duplicatas
ALTER TABLE appointment_requests
ADD CONSTRAINT unique_appointment_user_time
UNIQUE (appointment_id, user_id, selected_time);

-- RLS para appointment_cta
ALTER TABLE appointment_cta ENABLE ROW LEVEL SECURITY;

-- B2B proprietário pode criar
CREATE POLICY "B2B owners can create appointment_cta"
ON appointment_cta FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE memberships.tenant_id = appointment_cta.tenant_id
    AND memberships.user_id = auth.uid()
    AND memberships.role IN ('owner', 'admin')
  )
);

-- Todos podem visualizar appointment_cta
CREATE POLICY "Anyone can view appointment_cta"
ON appointment_cta FOR SELECT
USING (true);

-- RLS para appointment_requests
ALTER TABLE appointment_requests ENABLE ROW LEVEL SECURITY;

-- B2B proprietário pode visualizar todas as solicitações
CREATE POLICY "B2B owners can view all appointment_requests"
ON appointment_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE memberships.tenant_id = appointment_requests.tenant_id
    AND memberships.user_id = auth.uid()
    AND memberships.role IN ('owner', 'admin')
  )
);

-- B2C pode visualizar apenas suas próprias solicitações
CREATE POLICY "B2C can view own appointment_requests"
ON appointment_requests FOR SELECT
USING (user_id = auth.uid());

-- B2C pode criar solicitações
CREATE POLICY "Authenticated users can create appointment_requests"
ON appointment_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

-- B2B proprietário pode atualizar status
CREATE POLICY "B2B owners can update appointment_requests"
ON appointment_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE memberships.tenant_id = appointment_requests.tenant_id
    AND memberships.user_id = auth.uid()
    AND memberships.role IN ('owner', 'admin')
  )
);

-- indexes
CREATE INDEX idx_appointment_cta_post ON appointment_cta(post_id);
CREATE INDEX idx_appointment_cta_tenant ON appointment_cta(tenant_id);
CREATE INDEX idx_appointment_requests_appointment ON appointment_requests(appointment_id);
CREATE INDEX idx_appointment_requests_user ON appointment_requests(user_id);
CREATE INDEX idx_appointment_requests_tenant ON appointment_requests(tenant_id);
CREATE INDEX idx_appointment_requests_status ON appointment_requests(status);