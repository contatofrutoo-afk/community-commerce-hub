-- Create storage bucket (non-public for security)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES ('public', 'public', false, 104857600, NULL, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Storage policies with path-based ownership
DROP POLICY IF EXISTS "public_insert" ON storage.objects;
CREATE POLICY "public_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'public'
  AND auth.role() = 'authenticated'
  AND (
    name LIKE auth.uid()::text || '/%'
    OR name LIKE (
      SELECT m.tenant_id::text || '/%'
      FROM public.memberships m
      WHERE m.user_id = auth.uid()
      LIMIT 1
    )
  )
);

DROP POLICY IF EXISTS "public_select" ON storage.objects;
CREATE POLICY "public_select" ON storage.objects FOR SELECT USING (
  bucket_id = 'public'
  AND auth.role() = 'authenticated'
  AND (
    name LIKE auth.uid()::text || '/%'
    OR name LIKE (
      SELECT m.tenant_id::text || '/%'
      FROM public.memberships m
      WHERE m.user_id = auth.uid()
      LIMIT 1
    )
  )
);

DROP POLICY IF EXISTS "public_update" ON storage.objects;
CREATE POLICY "public_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'public'
  AND auth.role() = 'authenticated'
  AND (
    name LIKE auth.uid()::text || '/%'
    OR name LIKE (
      SELECT m.tenant_id::text || '/%'
      FROM public.memberships m
      WHERE m.user_id = auth.uid()
      LIMIT 1
    )
  )
);

DROP POLICY IF EXISTS "public_delete" ON storage.objects;
CREATE POLICY "public_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'public'
  AND auth.role() = 'authenticated'
  AND (
    name LIKE auth.uid()::text || '/%'
    OR name LIKE (
      SELECT m.tenant_id::text || '/%'
      FROM public.memberships m
      WHERE m.user_id = auth.uid()
      LIMIT 1
    )
  )
);