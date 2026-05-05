-- Fix: Create membership records for existing tenant owners
-- For tenants where the creator has no membership, create one
INSERT INTO memberships (tenant_id, user_id, role)
SELECT t.id, t.created_by, 'owner'
FROM tenants t
WHERE t.created_by IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM memberships m WHERE m.tenant_id = t.id AND m.user_id = t.created_by
);