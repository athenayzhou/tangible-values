-- get_session_gold + get_session_values

DROP FUNCTION IF EXISTS public.get_session_gold(uuid);
DROP FUNCTION IF EXISTS public.get_session_values(uuid);

-- -----------------------------------------------------------------------------
-- get_session_gold
-- -----------------------------------------------------------------------------
CREATE FUNCTION public.get_session_gold(p_session_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(sum(gl.amount), 0)::int
  FROM public.gold_ledger AS gl
  WHERE gl.session_id = p_session_id;
$$;

COMMENT ON FUNCTION public.get_session_gold(uuid) IS
  'Sum gold_ledger.amount for one session (same uuid as run_sessions.id).';

-- -----------------------------------------------------------------------------
-- get_session_values
-- Returns one HUD row. This version sums JSON value_deltas on decision_events
-- (matches the app insert). *_ema columns mirror *_raw until you add a real EMA
-- source (e.g. a snapshot table); standing is 0 here.
-- If you later create public.run_stats_snapshot, replace the body to SELECT from it.
-- -----------------------------------------------------------------------------
CREATE FUNCTION public.get_session_values(p_session_id uuid)
RETURNS TABLE (
  trust double precision,
  altruism double precision,
  deceit double precision,
  greed double precision,
  standing double precision,
  trust_raw double precision,
  altruism_raw double precision,
  deceit_raw double precision,
  greed_raw double precision,
  trust_ema double precision,
  altruism_ema double precision,
  deceit_ema double precision,
  greed_ema double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    coalesce(r.trust_raw, 0)::double precision AS trust,
    coalesce(r.altruism_raw, 0)::double precision AS altruism,
    coalesce(r.deceit_raw, 0)::double precision AS deceit,
    coalesce(r.greed_raw, 0)::double precision AS greed,
    0::double precision AS standing,
    coalesce(r.trust_raw, 0)::double precision AS trust_raw,
    coalesce(r.altruism_raw, 0)::double precision AS altruism_raw,
    coalesce(r.deceit_raw, 0)::double precision AS deceit_raw,
    coalesce(r.greed_raw, 0)::double precision AS greed_raw,
    coalesce(r.trust_raw, 0)::double precision AS trust_ema,
    coalesce(r.altruism_raw, 0)::double precision AS altruism_ema,
    coalesce(r.deceit_raw, 0)::double precision AS deceit_ema,
    coalesce(r.greed_raw, 0)::double precision AS greed_ema
  FROM (
    SELECT
      sum((coalesce(e.value_deltas, '{}'::jsonb)->>'trust')::double precision) AS trust_raw,
      sum((coalesce(e.value_deltas, '{}'::jsonb)->>'altruism')::double precision) AS altruism_raw,
      sum((coalesce(e.value_deltas, '{}'::jsonb)->>'deceit')::double precision) AS deceit_raw,
      sum((coalesce(e.value_deltas, '{}'::jsonb)->>'greed')::double precision) AS greed_raw
    FROM public.decision_events AS e
    WHERE e.session_id = p_session_id
  ) AS r;
$$;

COMMENT ON FUNCTION public.get_session_values(uuid) IS
  'HUD row: summed value_deltas from decision_events for session_id = p_session_id.';

-- -----------------------------------------------------------------------------
-- Grants (adjust roles to match your project)
-- -----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_session_gold(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_session_values(uuid) TO anon, authenticated, service_role;
