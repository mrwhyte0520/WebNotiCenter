CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  external_user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(app_id, external_user_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'app_users_app_id_external_user_id_key'
  ) THEN
    ALTER TABLE public.app_users
      ADD CONSTRAINT app_users_app_id_external_user_id_key
      UNIQUE (app_id, external_user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_app_users_app_id ON public.app_users(app_id);
CREATE INDEX IF NOT EXISTS idx_app_users_external_user_id ON public.app_users(external_user_id);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage app users"
  ON public.app_users
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = app_users.app_id
        AND a.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = app_users.app_id
        AND a.owner_id = auth.uid()
    )
  );
