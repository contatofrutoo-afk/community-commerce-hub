-- Function to increment topic replies count and update last activity
CREATE OR REPLACE FUNCTION public.increment_topic_replies(topic_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.topics 
  SET 
    replies_count = COALESCE(replies_count, 0) + 1,
    last_activity_at = now()
  WHERE id = topic_id;
END;
$$;