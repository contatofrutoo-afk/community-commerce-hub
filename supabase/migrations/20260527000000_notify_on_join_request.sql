-- Notification when B2C requests to join community

CREATE OR REPLACE FUNCTION public.notify_on_join_request()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_actor_name TEXT;
  v_actor_email TEXT;
  v_tenant_name TEXT;
BEGIN
  IF NEW.status = 'pending' THEN
    -- Get actor info
    SELECT p.name, p.email INTO v_actor_name, v_actor_email
    FROM public.profiles p WHERE p.user_id = NEW.user_id;

    -- Get tenant name
    SELECT t.name INTO v_tenant_name
    FROM public.tenants t WHERE t.id = NEW.tenant_id;

    -- Notify all owners and admins of the tenant
    INSERT INTO public.notifications (tenant_id, user_id, actor_id, type, title, priority, data, reference_id)
    SELECT 
      NEW.tenant_id,
      m.user_id,
      NEW.user_id,
      'join_request',
      'Nova solicitação de acesso',
      'high',
      jsonb_build_object(
        'request_id', NEW.id,
        'user_name', COALESCE(v_actor_name, 'Usuário desconhecido'),
        'user_email', COALESCE(v_actor_email, ''),
        'tenant_name', COALESCE(v_tenant_name, '')
      ),
      NEW.id
    FROM public.memberships m
    WHERE m.tenant_id = NEW.tenant_id 
      AND m.role IN ('owner', 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_join_request ON public.community_requests;
CREATE TRIGGER trg_notify_join_request AFTER INSERT ON public.community_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_on_join_request();