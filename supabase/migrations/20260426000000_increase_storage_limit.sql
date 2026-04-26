-- Update storage bucket limit to 100MB for videos
UPDATE storage.buckets SET file_size_limit = 104857600 WHERE id = 'public';