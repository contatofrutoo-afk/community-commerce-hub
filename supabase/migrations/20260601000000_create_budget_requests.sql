-- Tabela de solicitações de orçamento
CREATE TABLE IF NOT EXISTS budget_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  post_id uuid REFERENCES posts(id),
  user_id uuid REFERENCES auth.users(id),
  name text,
  email text,
  phone text,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Constraint para evitar duplicatas
ALTER TABLE budget_requests
ADD CONSTRAINT unique_post_user_budget
UNIQUE (post_id, user_id);

-- Policies
ALTER TABLE budget_requests ENABLE ROW LEVEL SECURITY;

-- B2C pode criar
CREATE POLICY "Authenticated users can create budget_requests"
ON budget_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

-- B2C pode ver apenas os próprios
CREATE POLICY "B2C can view own budget_requests"
ON budget_requests FOR SELECT
USING (user_id = auth.uid());

-- B2B proprietário pode visualizar todos da comunidade
CREATE POLICY "B2B owners can view all budget_requests"
ON budget_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE memberships.tenant_id = budget_requests.tenant_id
    AND memberships.user_id = auth.uid()
    AND memberships.role IN ('owner', 'admin')
  )
);

-- B2B proprietário pode atualizar
CREATE POLICY "B2B owners can update budget_requests"
ON budget_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE memberships.tenant_id = budget_requests.tenant_id
    AND memberships.user_id = auth.uid()
    AND memberships.role IN ('owner', 'admin')
  )
);

-- Índices
CREATE INDEX idx_budget_requests_post ON budget_requests(post_id);
CREATE INDEX idx_budget_requests_tenant ON budget_requests(tenant_id);
CREATE INDEX idx_budget_requests_user ON budget_requests(user_id);
CREATE INDEX idx_budget_requests_status ON budget_requests(status);