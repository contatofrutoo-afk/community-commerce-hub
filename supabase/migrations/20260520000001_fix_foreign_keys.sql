-- Add foreign key relationships for groups feature
-- Run this in Supabase SQL Editor

-- Check if foreign key exists for group_posts -> profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'group_posts_author_id_fkey'
    AND table_name = 'group_posts'
  ) THEN
    ALTER TABLE group_posts ADD CONSTRAINT group_posts_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Check if foreign key exists for group_replies -> profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'group_replies_author_id_fkey'
    AND table_name = 'group_replies'
  ) THEN
    ALTER TABLE group_replies ADD CONSTRAINT group_replies_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Check if foreign key exists for group_posts -> groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'group_posts_group_id_fkey'
    AND table_name = 'group_posts'
  ) THEN
    ALTER TABLE group_posts ADD CONSTRAINT group_posts_group_id_fkey 
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Check if foreign key exists for group_replies -> group_posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'group_replies_post_id_fkey'
    AND table_name = 'group_replies'
  ) THEN
    ALTER TABLE group_replies ADD CONSTRAINT group_replies_post_id_fkey 
    FOREIGN KEY (post_id) REFERENCES group_posts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Check if foreign key exists for group_members -> groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'group_members_group_id_fkey'
    AND table_name = 'group_members'
  ) THEN
    ALTER TABLE group_members ADD CONSTRAINT group_members_group_id_fkey 
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Check if foreign key exists for group_members -> profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'group_members_user_id_fkey'
    AND table_name = 'group_members'
  ) THEN
    ALTER TABLE group_members ADD CONSTRAINT group_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Verify foreign keys created
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('group_posts', 'group_replies', 'group_members');