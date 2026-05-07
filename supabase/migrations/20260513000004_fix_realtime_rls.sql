-- Fix: Restringir Realtime em community_messages para evitar subscribe não autorizado
-- Opção 1: Remover da publicação realtime (mais seguro)
ALTER PUBLICATION supabase_realtime DROP TABLE public.community_messages;

-- Opção 2: Se precisar de realtime, usar channel-scoped subscriptions no cliente
-- O cliente deve subscrever apenas a canais 'tenant:{tenant_id}' onde é membro
-- Adicionar verificação no cliente antes de conectar ao canal