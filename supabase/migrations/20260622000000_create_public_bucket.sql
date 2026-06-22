-- Create the "public" storage bucket if it doesn't exist
-- This bucket is needed for:
--   - Avatar uploads (Profile.tsx now uses data URIs instead)
--   - Post media uploads (CreatePost.tsx)
--   - Tenant logo uploads (legacy)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('public', 'public', true, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to insert their own files
DROP POLICY IF EXISTS "public_insert" ON storage.objects;
CREATE POLICY "public_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'public'
    AND auth.role() = 'authenticated'
  );

-- Allow public read access (bucket is public)
DROP POLICY IF EXISTS "public_select" ON storage.objects;
CREATE POLICY "public_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'public');

-- Allow authenticated users to update their own files (by path prefix)
DROP POLICY IF EXISTS "public_update" ON storage.objects;
CREATE POLICY "public_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'public'
    AND auth.role() = 'authenticated'
    AND (name LIKE (auth.uid()::text || '/%') OR name LIKE ((SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid() LIMIT 1)::text || '/%'))
  );

-- Allow authenticated users to delete their own files
DROP POLICY IF EXISTS "public_delete" ON storage.objects;
CREATE POLICY "public_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'public'
    AND auth.role() = 'authenticated'
    AND (name LIKE (auth.uid()::text || '/%') OR name LIKE ((SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid() LIMIT 1)::text || '/%'))
  );
