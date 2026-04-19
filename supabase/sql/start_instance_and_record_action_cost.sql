-- start_instance + record_action_cost
-- Matches src/lib/supabaseClient.js:
--   start_instance(p_session_id, p_thought_id, p_stake)
--   record_action_cost(p_session_id, p_instance_id, p_cost, p_reason)
--
-- Requires:
--   • public.get_session_gold(uuid)
--   • public.gold_ledger(session_id, amount, entry_type NOT NULL, …) — literals 'stake' / 'cost'
--     must match your enum or check constraint if applicable.
--   • public.thought_instances(id uuid PK, session_id uuid, thought_id text,
--       stake_amount numeric NOT NULL, settled_at timestamptz NULL)
--     with default gen_random_uuid() on id
--   • Optional: public.run_sessions(id uuid) — enable the session check block below
--
-- If FK column is run_session_id instead of session_id, replace in INSERT/WHERE.

DROP FUNCTION IF EXISTS public.start_instance(uuid, text, integer);
DROP FUNCTION IF EXISTS public.start_instance(uuid, text, numeric);

DROP FUNCTION IF EXISTS public.record_action_cost(uuid, uuid, integer, text);
DROP FUNCTION IF EXISTS public.record_action_cost(uuid, uuid, numeric, text);
DROP FUNCTION IF EXISTS public.record_action_cost(uuid, uuid, bigint, text);

-- -----------------------------------------------------------------------------
-- start_instance
-- One open instance per (session_id, thought_id). Retrying returns the same row
-- without charging stake again. New instance: optional stake debit, then INSERT.
-- -----------------------------------------------------------------------------
CREATE FUNCTION public.start_instance(
  p_session_id uuid,
  p_thought_id text,
  p_stake numeric
)
RETURNS TABLE (
  instance_id uuid,
  balance integer
)
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  tid text := nullif(trim(p_thought_id), '');
  stake int := greatest(0, trunc(coalesce(p_stake, 0))::int);
  existing uuid;
  bal int;
  new_id uuid;
BEGIN
  IF tid IS NULL OR tid NOT IN ('dictator', 'volunteer', 'exchange', 'trust') THEN
    RAISE EXCEPTION 'invalid p_thought_id: %', p_thought_id USING ERRCODE = 'P0001';
  END IF;

  -- Optional: enforce session exists (uncomment if public.run_sessions exists)
  -- IF NOT EXISTS (SELECT 1 FROM public.run_sessions rs WHERE rs.id = p_session_id) THEN
  --   RAISE EXCEPTION 'session not found: %', p_session_id USING ERRCODE = 'P0001';
  -- END IF;

  SELECT ti.id
  INTO existing
  FROM public.thought_instances AS ti
  WHERE ti.session_id = p_session_id
    AND ti.thought_id = tid
    AND ti.settled_at IS NULL
  LIMIT 1;

  IF existing IS NOT NULL THEN
    bal := public.get_session_gold(p_session_id);
    RETURN QUERY SELECT existing, bal;
    RETURN;
  END IF;

  bal := public.get_session_gold(p_session_id);
  IF stake > 0 AND bal < stake THEN
    RAISE EXCEPTION 'insufficient gold for stake (have %, need %)', bal, stake
      USING ERRCODE = 'P0001';
  END IF;

  IF stake > 0 THEN
    INSERT INTO public.gold_ledger (session_id, amount, entry_type)
    VALUES (p_session_id, -stake, 'stake');
  END IF;

  INSERT INTO public.thought_instances (session_id, thought_id, stake_amount)
  VALUES (p_session_id, tid, stake)
  RETURNING id INTO new_id;

  bal := public.get_session_gold(p_session_id);
  RETURN QUERY SELECT new_id, bal;
END;
$$;

COMMENT ON FUNCTION public.start_instance(uuid, text, numeric) IS
  'Open a thought instance; debits stake on gold_ledger when p_stake > 0.';

-- -----------------------------------------------------------------------------
-- record_action_cost
-- Debits gold for an in-flight instance (settled_at IS NULL).
-- -----------------------------------------------------------------------------
CREATE FUNCTION public.record_action_cost(
  p_session_id uuid,
  p_instance_id uuid,
  p_cost numeric,
  p_reason text
)
RETURNS TABLE (
  balance integer
)
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  cost int := greatest(0, trunc(coalesce(p_cost, 0))::int);
  bal int;
BEGIN
  -- p_reason: use for a meta/details column later; entry_type uses fixed 'cost' for enums.
  IF cost = 0 THEN
    bal := public.get_session_gold(p_session_id);
    RETURN QUERY SELECT bal;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.thought_instances AS ti
    WHERE ti.id = p_instance_id
      AND ti.session_id = p_session_id
      AND ti.settled_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'thought instance not found, wrong session, or already settled (id=%)',
      p_instance_id
      USING ERRCODE = 'P0001';
  END IF;

  bal := public.get_session_gold(p_session_id);
  IF bal < cost THEN
    RAISE EXCEPTION 'insufficient gold for action cost (have %, need %)', bal, cost
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.gold_ledger (session_id, amount, entry_type)
  VALUES (p_session_id, -cost, 'cost');

  bal := public.get_session_gold(p_session_id);
  RETURN QUERY SELECT bal;
END;
$$;

COMMENT ON FUNCTION public.record_action_cost(uuid, uuid, numeric, text) IS
  'Debit gold during an open thought instance; validates instance belongs to session.';

GRANT EXECUTE ON FUNCTION public.start_instance(uuid, text, numeric)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_action_cost(uuid, uuid, numeric, text)
  TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
