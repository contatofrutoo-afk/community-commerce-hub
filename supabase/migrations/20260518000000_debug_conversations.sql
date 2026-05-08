-- Debug: Função para listar todas as conversas de um tenant (bypassa RLS)
DROP FUNCTION IF EXISTS public.get_all_conversations_for_tenant(UUID);
CREATE OR REPLACE FUNCTION public.get_all_conversations_for_tenant(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  title TEXT,
  description TEXT,
  visibility TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  archived BOOLEAN,
  max_pins INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.tenant_id,
    c.title,
    c.description,
    c.visibility::TEXT,
    c.created_by,
    c.created_at,
    c.updated_at,
    c.archived,
    c.max_pins
  FROM public.conversations c
  WHERE c.tenant_id = p_tenant_id
  ORDER BY c.updated_at DESC;
END;
$$;

-- Verificar conversas existentes
SELECT c.id, c.title, c.tenant_id, c.visibility, c.created_at, c.archived 
FROM public.conversations c 
ORDER BY c.created_at DESC 
LIMIT 20;