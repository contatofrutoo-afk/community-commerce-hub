-- Onboarding progress tracking per tenant
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  step_completed TEXT DEFAULT 'not_started',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_onboarding_user ON public.onboarding_progress(user_id);
CREATE INDEX idx_onboarding_tenant ON public.onboarding_progress(tenant_id);

-- RLS Policies
DROP POLICY IF EXISTS "read onboarding_progress" ON public.onboarding_progress;
CREATE POLICY "read onboarding_progress" ON public.onboarding_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert onboarding_progress" ON public.onboarding_progress;
CREATE POLICY "insert onboarding_progress" ON public.onboarding_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update onboarding_progress" ON public.onboarding_progress;
CREATE POLICY "update onboarding_progress" ON public.onboarding_progress FOR UPDATE USING (auth.uid() = user_id);

-- Add last_activity_at to topics if not exists (for ordering active conversations)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'topics' AND column_name = 'last_activity_at') THEN
    ALTER TABLE public.topics ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Add cta_clicks tracking if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'post_cta' AND column_name = 'clicks') THEN
    ALTER TABLE public.post_cta ADD COLUMN clicks INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'post_cta' AND column_name = 'conversions') THEN
    ALTER TABLE public.post_cta ADD COLUMN conversions INTEGER DEFAULT 0;
  END IF;
END $$;