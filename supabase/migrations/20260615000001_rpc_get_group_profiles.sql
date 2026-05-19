-- RPC function to get profiles for group members (bypasses RLS)
CREATE OR REPLACE FUNCTION get_group_member_profiles(p_group_id UUID)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.name,
    p.avatar_url
  FROM public.profiles p
  INNER JOIN public.group_members gm ON gm.user_id = p.user_id
  WHERE gm.group_id = p_group_id;
END;
$$;

-- Also allow getting profile by user ID for post authors
CREATE OR REPLACE FUNCTION get_profiles_by_ids(p_user_ids UUID[])
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.name,
    p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = ANY(p_user_ids);
END;
$$;