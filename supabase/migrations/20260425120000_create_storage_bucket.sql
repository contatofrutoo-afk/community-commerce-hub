-- Create public storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES ('public', 'public', true, 5242880, NULL, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "public_insert" ON storage.objects;
CREATE POLICY "public_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'public' AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "public_select" ON storage.objects;
CREATE POLICY "public_select" ON storage.objects FOR SELECT USING (
  bucket_id = 'public'
);

DROP POLICY IF EXISTS "public_update" ON storage.objects;
CREATE POLICY "public_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'public' AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "public_delete" ON storage.objects;
CREATE POLICY "public_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'public' AND auth.role() = 'authenticated'
);