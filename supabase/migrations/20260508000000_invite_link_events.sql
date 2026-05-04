-- Create invite_link_events table for tracking invite link metrics
CREATE TABLE IF NOT EXISTS invite_link_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('visit', 'signup', 'login')),
  ref TEXT,
  campaign TEXT,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE invite_link_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invite_link_events_tenant_access" ON invite_link_events
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_invite_link_events_tenant ON invite_link_events(tenant_id);
CREATE INDEX idx_invite_link_events_created ON invite_link_events(created_at DESC);
CREATE INDEX idx_invite_link_events_type ON invite_link_events(event_type);