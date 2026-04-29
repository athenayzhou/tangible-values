-- get_thought_aggregate(p_thought_id text) -> jsonb
-- Replaces legacy signature (same arg type) where the parameter was named p_thought.
-- PostgREST requires the request body keys to match parameter names.
--
-- Aggregates from public.decision_events (thought_id + payload) so it stays in sync
-- with settle_decision + buildDecisionPayload in the app.
-- If your column is still named "thought", change WHERE clauses accordingly.
--
-- DROP is required when renaming the argument on an existing (text) function.

DROP FUNCTION IF EXISTS public.get_thought_aggregate(text);

CREATE FUNCTION public.get_thought_aggregate(p_thought_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  tid text := nullif(trim(p_thought_id), '');
BEGIN
  IF tid IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  IF tid = 'dictator' THEN
    RETURN (
      SELECT jsonb_build_object(
        'n', count(*)::bigint,
        'mean_kept', avg(10 - coalesce((e.payload->>'receiver_coins')::numeric, 0)),
        'mean_given', avg(coalesce((e.payload->>'receiver_coins')::numeric, 0))
      )
      FROM public.decision_events AS e
      WHERE e.thought_id = tid
    );
  END IF;

  IF tid = 'volunteer' THEN
    RETURN (
      WITH s AS (
        SELECT
          count(*)::bigint AS n,
          count(*) FILTER (WHERE trim(coalesce(e.payload->>'majority', '')) = '1') AS c1,
          count(*) FILTER (WHERE trim(coalesce(e.payload->>'majority', '')) = '5') AS c5
        FROM public.decision_events AS e
        WHERE e.thought_id = tid
      )
      SELECT jsonb_build_object(
        'n', s.n,
        'count_one', s.c1,
        'count_five', s.c5,
        'pct_one', CASE WHEN s.n > 0 THEN round((100.0 * s.c1 / s.n)::numeric, 2) END,
        'pct_five', CASE WHEN s.n > 0 THEN round((100.0 * s.c5 / s.n)::numeric, 2) END
      )
      FROM s
    );
  END IF;

  IF tid = 'exchange' THEN
    RETURN (
      WITH s AS (
        SELECT
          count(*)::bigint AS n,
          count(*) FILTER (WHERE lower(trim(coalesce(e.payload->>'choice', ''))) = 'deceive') AS ck,
          count(*) FILTER (WHERE lower(trim(coalesce(e.payload->>'choice', ''))) = 'exchange') AS cx
        FROM public.decision_events AS e
        WHERE e.thought_id = tid
      )
      SELECT jsonb_build_object(
        'n', s.n,
        'count_keep', s.ck,
        'count_exchange', s.cx,
        'pct_keep', CASE WHEN s.n > 0 THEN round((100.0 * s.ck / s.n)::numeric, 2) END,
        'pct_exchange', CASE WHEN s.n > 0 THEN round((100.0 * s.cx / s.n)::numeric, 2) END
      )
      FROM s
    );
  END IF;

  IF tid = 'trust' THEN
    RETURN (
      SELECT jsonb_build_object(
        'n', count(*)::bigint,
        'mean_sent', avg(coalesce((e.payload->>'sent')::numeric, 0)),
        'avg_sent', avg(coalesce((e.payload->>'sent')::numeric, 0))
      )
      FROM public.decision_events AS e
      WHERE e.thought_id = tid
    );
  END IF;

  RETURN '{}'::jsonb;
END;
$$;

COMMENT ON FUNCTION public.get_thought_aggregate(text) IS
  'Cross-session aggregates for one thought_id; keys align with aggregateDisplay.js.';

GRANT EXECUTE ON FUNCTION public.get_thought_aggregate(text) TO anon, authenticated, service_role;
