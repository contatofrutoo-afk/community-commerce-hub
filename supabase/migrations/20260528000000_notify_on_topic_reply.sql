-- Notification when someone replies in a conversation topic
-- Notifies all participants who have already posted in that conversation (except the author)

CREATE OR REPLACE FUNCTION public.notify_on_topic_reply()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_actor_name TEXT;
  v_topic_title TEXT;
BEGIN
  -- Get the message author's name
  SELECT COALESCE(p.name, 'Usuário') INTO v_actor_name
  FROM public.profiles p WHERE p.user_id = NEW.user_id;

  -- Get the topic title
  SELECT COALESCE(t.title, 'Conversa') INTO v_topic_title
  FROM public.topics t WHERE t.id = NEW.topic_id;

  -- Notify all users who have posted in this conversation (except the author)
  INSERT INTO public.notifications (tenant_id, user_id, actor_id, type, title, priority, data, reference_id)
  SELECT DISTINCT
    NEW.topic_id,  -- Use topic_id as tenant_id for conversation notifications
    tm.user_id,
    NEW.user_id,
    'topic_reply',
    v_actor_name || ' respondeu na conversa',
    'normal',
    jsonb_build_object(
      'topic_id', NEW.topic_id,
      'topic_title', v_topic_title,
      'message_id', NEW.id,
      'message_preview', LEFT(NEW.content, 80),
      'actor_name', v_actor_name
    ),
    NEW.topic_id
  FROM public.topic_messages tm
  WHERE tm.topic_id = NEW.topic_id
    AND tm.user_id != NEW.user_id
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_topic_reply ON public.topic_messages;
CREATE TRIGGER trg_notify_topic_reply AFTER INSERT ON public.topic_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_topic_reply();