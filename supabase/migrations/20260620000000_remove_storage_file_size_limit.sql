-- Remove file size limit from storage bucket (unlimited uploads)
UPDATE storage.buckets SET file_size_limit = NULL WHERE id = 'public';
