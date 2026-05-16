-- 1. Adiciona colunas que faltavam na tabela event_registrations
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS event_name text;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS event_date date;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS event_time text;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS location text;

-- 2. Resgata inscricoes antigas que estavam salvas no config_json do post_cta
INSERT INTO event_registrations (event_id, post_id, tenant_id, user_id, name, email, phone, notes, answers, status, event_name, event_date, created_at)
SELECT 
    p.id as event_id,
    p.post_id,
    posts.tenant_id,
    NULLIF(reg->>'user_id', '')::uuid as user_id,
    reg->>'user_name' as name,
    reg->>'user_email' as email,
    reg->>'user_phone' as phone,
    reg->>'notes' as notes,
    COALESCE(reg->'custom_answers', '{}'::jsonb) as answers,
    'pending' as status,
    p.config_json->'event_data'->>'event_name' as event_name,
    (CASE WHEN NULLIF(p.config_json->'event_data'->>'event_date', '') IS NULL THEN NULL 
          ELSE (p.config_json->'event_data'->>'event_date')::date END) as event_date,
    COALESCE(NULLIF(reg->>'created_at', '')::timestamptz, now()) as created_at
FROM post_cta p
JOIN posts ON posts.id = p.post_id,
LATERAL jsonb_array_elements(
    CASE 
        WHEN jsonb_typeof(p.config_json->'event_data'->'registrations') = 'array' 
        THEN p.config_json->'event_data'->'registrations' 
        ELSE '[]'::jsonb 
    END
) as reg
WHERE p.type = 'register'
ON CONFLICT (event_id, user_id) DO NOTHING;
