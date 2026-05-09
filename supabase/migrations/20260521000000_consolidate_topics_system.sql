-- =============================================
-- TOPICS SYSTEM - CONSOLIDATED
-- Estabilização estrutural - única fonte de verdade
-- =============================================

-- =============================================
-- 1. DROPAR TRIGGERS ANTES DAS FUNÇÕES
-- =============================================

DROP TRIGGER IF EXISTS trg_topic_reply_count ON public.topic_messages;
DROP TRIGGER IF EXISTS trigger_topic_message_insert ON public.topic_messages;
DROP TRIGGER IF EXISTS trg_notify_topic_reply ON public.topic_messages;
DROP TRIGGER IF EXISTS trg_notify_mention ON public.topic_messages;

-- =============================================
-- 2. DROPAR FUNÇÕES ANTIGAS
-- =============================================

DROP FUNCTION IF EXISTS public.update_topic_reply_count();
DROP FUNCTION IF EXISTS public.update_topic_activity();
DROP FUNCTION IF EXISTS public.notify_on_topic_reply();
DROP FUNCTION IF EXISTS public.increment_topic_replies(UUID);
DROP FUNCTION IF EXISTS public.compute_topic_score(UUID);

-- =============================================
-- 3. POLICIES SIMPLES E CONSISTENTES
-- =============================================

-- topics SELECT - apenas membros
DROP POLICY IF EXISTS topics_select_member ON public.topics;
CREATE POLICY topics_select_member ON public.topics FOR SELECT USING (
  public.is_tenant_member_check(auth.uid(), tenant_id)
);

-- topics INSERT - membros podem criar
DROP POLICY IF EXISTS topics_insert_member ON public.topics;
CREATE POLICY topics_insert_member ON public.topics FOR INSERT WITH CHECK (
  public.is_tenant_member_check(auth.uid(), tenant_id) AND auth.uid() = created_by
);

-- topics UPDATE - autor ou admin
DROP POLICY IF EXISTS topics_update_owner ON public.topics;
CREATE POLICY topics_update_owner ON public.topics FOR UPDATE USING (
  auth.uid() = created_by OR public.is_tenant_admin_check(auth.uid(), tenant_id)
);

-- topics DELETE - autor ou admin
DROP POLICY IF EXISTS topics_delete_owner ON public.topics;
CREATE POLICY topics_delete_owner ON public.topics FOR DELETE USING (
  auth.uid() = created_by OR public.is_tenant_admin_check(auth.uid(), tenant_id)
);

-- topic_messages SELECT - membros do tenant
DROP POLICY IF EXISTS topic_messages_select_member ON public.topic_messages;
CREATE POLICY topic_messages_select_member ON public.topic_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.topics t
    WHERE t.id = topic_id AND public.is_tenant_member_check(auth.uid(), t.tenant_id)
  )
);

-- topic_messages INSERT - membros podem enviar
DROP POLICY IF EXISTS topic_messages_insert_auth ON public.topic_messages;
CREATE POLICY topic_messages_insert_auth ON public.topic_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.topics t
    WHERE t.id = topic_id AND public.is_tenant_member_check(auth.uid(), t.tenant_id)
  )
);

-- topic_messages UPDATE - autor ou admin
DROP POLICY IF EXISTS topic_messages_update_own ON public.topic_messages;
CREATE POLICY topic_messages_update_own ON public.topic_messages FOR UPDATE USING (
  auth.uid() = user_id OR public.is_tenant_admin_check(auth.uid(),
    (SELECT tenant_id FROM public.topics WHERE id = topic_id)
  )
);

-- topic_messages DELETE - autor ou admin
DROP POLICY IF EXISTS topic_messages_delete_own ON public.topic_messages;
CREATE POLICY topic_messages_delete_own ON public.topic_messages FOR DELETE USING (
  auth.uid() = user_id OR public.is_tenant_admin_check(auth.uid(),
    (SELECT tenant_id FROM public.topics WHERE id = topic_id)
  )
);

-- =============================================
-- 4. REALTIME - apenas se necessário
-- =============================================

-- Desabilitar realtime para topics (evitar sincronização agressiva)
-- ALTER PUBLICATION supabase_realtime DROP TABLE public.topics;
-- ALTER PUBLICATION supabase_realtime DROP TABLE public.topic_messages;

-- =============================================
-- 5. VERIFICAÇÃO
-- =============================================

SELECT 'Policies topics:' AS info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'topics';

SELECT 'Policies topic_messages:' AS info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'topic_messages';

SELECT 'Pronto!' AS status;