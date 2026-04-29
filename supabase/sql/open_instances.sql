-- list_open_instances — unsettled thought_instances for a run session (resume after refresh).
-- Client: supabase.rpc('open_instances', { p_session_id })

CREATE OR REPLACE FUNCTION public.open_instances(p_session_id uuid)
RETURNS TABLE (
  thought_id text,
  instance_id uuid
)
LANGUAGE sql
AS $$
  SELECT
    ti.thought_id,
    ti.id AS instance_id
  FROM public.thought_instances AS ti
  WHERE ti.session_id = p_session_id
    AND ti.settled_at IS NULL
    AND ti.thought_id IN ('dictator', 'volunteer', 'exchange', 'trust');
$$;

COMMENT ON FUNCTION public.open_instances(uuid) IS
  'Open (unsettled) thought instances for hydration after reload.';

GRANT EXECUTE ON FUNCTION public.open_instances(uuid)
  TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';