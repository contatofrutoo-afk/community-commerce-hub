-- =============================================
-- CONVERSATIONS SYSTEM - RLS POLICIES
-- Run after 20260514000000_create_conversations_system.sql
-- =============================================

-- conversations policies
DROP POLICY IF EXISTS conversations_select ON public.conversations;
CREATE POLICY conversations_select ON public.conversations FOR SELECT USING (archived = false AND (visibility = 'public' AND public.is_tenant_member_check(auth.uid(), tenant_id) OR visibility = 'internal' AND public.is_tenant_admin_check(auth.uid(), tenant_id) OR EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = id AND cm.user_id = auth.uid()) OR public.is_tenant_admin_check(auth.uid(), tenant_id)));

DROP POLICY IF EXISTS conversations_insert ON public.conversations;
CREATE POLICY conversations_insert ON public.conversations FOR INSERT WITH CHECK (public.is_tenant_admin_check(auth.uid(), tenant_id));

DROP POLICY IF EXISTS conversations_update ON public.conversations;
CREATE POLICY conversations_update ON public.conversations FOR UPDATE USING (public.is_tenant_admin_check(auth.uid(), tenant_id) OR (EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = id AND cm.user_id = auth.uid() AND cm.role = 'owner') AND (archived IS NOT DISTINCT FROM false)));

DROP POLICY IF EXISTS conversations_delete ON public.conversations;
CREATE POLICY conversations_delete ON public.conversations FOR DELETE USING (public.is_tenant_admin_check(auth.uid(), tenant_id));

-- conversation_members policies
DROP POLICY IF EXISTS conv_members_select ON public.conversation_members;
CREATE POLICY conv_members_select ON public.conversation_members FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (public.is_tenant_admin_check(auth.uid(), c.tenant_id) OR c.visibility = 'public' AND public.is_tenant_member_check(auth.uid(), c.tenant_id) OR c.visibility = 'internal' AND public.is_tenant_admin_check(auth.uid(), c.tenant_id) OR EXISTS (SELECT 1 FROM public.conversation_members cm2 WHERE cm2.conversation_id = c.id AND cm2.user_id = auth.uid()))));

DROP POLICY IF EXISTS conv_members_insert ON public.conversation_members;
CREATE POLICY conv_members_insert ON public.conversation_members FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (public.is_tenant_admin_check(auth.uid(), c.tenant_id) OR c.visibility = 'private' AND EXISTS (SELECT 1 FROM public.conversation_members cm_adder WHERE cm_adder.conversation_id = c.id AND cm_adder.user_id = auth.uid() AND cm_adder.role IN ('owner', 'moderator')))));

DROP POLICY IF EXISTS conv_members_update ON public.conversation_members;
CREATE POLICY conv_members_update ON public.conversation_members FOR UPDATE USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND public.is_tenant_admin_check(auth.uid(), c.tenant_id)));

DROP POLICY IF EXISTS conv_members_delete ON public.conversation_members;
CREATE POLICY conv_members_delete ON public.conversation_members FOR DELETE USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND public.is_tenant_admin_check(auth.uid(), c.tenant_id)));

-- conversation_messages policies
DROP POLICY IF EXISTS conv_messages_select ON public.conversation_messages;
CREATE POLICY conv_messages_select ON public.conversation_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (public.is_tenant_admin_check(auth.uid(), c.tenant_id) OR c.visibility = 'public' AND public.is_tenant_member_check(auth.uid(), c.tenant_id) OR c.visibility = 'internal' AND public.is_tenant_admin_check(auth.uid(), c.tenant_id) OR EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = c.id AND cm.user_id = auth.uid()))));

DROP POLICY IF EXISTS conv_messages_insert ON public.conversation_messages;
CREATE POLICY conv_messages_insert ON public.conversation_messages FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.archived = false AND (public.is_tenant_admin_check(auth.uid(), c.tenant_id) OR c.visibility = 'public' AND public.is_tenant_member_check(auth.uid(), c.tenant_id) OR c.visibility = 'internal' AND public.is_tenant_admin_check(auth.uid(), c.tenant_id) OR EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = c.id AND cm.user_id = auth.uid()))));

DROP POLICY IF EXISTS conv_messages_update ON public.conversation_messages;
CREATE POLICY conv_messages_update ON public.conversation_messages FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = pinned_by OR EXISTS (SELECT 1 FROM public.conversations c JOIN public.conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = auth.uid() WHERE c.id = conversation_id AND cm.role IN ('owner', 'moderator')) OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND public.is_tenant_admin_check(auth.uid(), c.tenant_id)));

DROP POLICY IF EXISTS conv_messages_delete ON public.conversation_messages;
CREATE POLICY conv_messages_delete ON public.conversation_messages FOR DELETE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.conversations c JOIN public.conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = auth.uid() WHERE c.id = conversation_id AND cm.role IN ('owner', 'moderator')) OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND public.is_tenant_admin_check(auth.uid(), c.tenant_id)));

-- Triggers
DROP TRIGGER IF EXISTS trigger_conversation_message_insert ON public.conversation_messages;
CREATE TRIGGER trigger_conversation_message_insert AFTER INSERT ON public.conversation_messages FOR EACH ROW WHEN (NEW.deleted = false) EXECUTE FUNCTION public.update_conversation_activity();

DROP TRIGGER IF EXISTS trigger_conversation_member_change ON public.conversation_members;
CREATE TRIGGER trigger_conversation_member_change AFTER INSERT OR UPDATE OR DELETE ON public.conversation_members FOR EACH ROW EXECUTE FUNCTION public.update_conversation_on_member_change();
