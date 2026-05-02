
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS posts_one_pinned_per_tenant
  ON public.posts (tenant_id) WHERE is_pinned = true;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS community_name text,
  ADD COLUMN IF NOT EXISTS community_description text;
