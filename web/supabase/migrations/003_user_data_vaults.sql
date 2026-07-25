-- Per-user encrypted finance vault (full app backup JSON for restore after reinstall)
CREATE TABLE IF NOT EXISTS public.user_data_vaults (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  backup_version INTEGER NOT NULL DEFAULT 3 CHECK (backup_version >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_data_vaults ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_data_vaults_select ON public.user_data_vaults;
DROP POLICY IF EXISTS user_data_vaults_insert ON public.user_data_vaults;
DROP POLICY IF EXISTS user_data_vaults_update ON public.user_data_vaults;
DROP POLICY IF EXISTS user_data_vaults_delete ON public.user_data_vaults;

CREATE POLICY user_data_vaults_select ON public.user_data_vaults
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_data_vaults_insert ON public.user_data_vaults
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_data_vaults_update ON public.user_data_vaults
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_data_vaults_delete ON public.user_data_vaults
  FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON public.user_data_vaults TO authenticated;
