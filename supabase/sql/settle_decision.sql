-- settle_decision — matches frontend RPC in src/lib/supabaseClient.js:
-- gold_ledger.entry_type: literal 'payout' (align with your enum / CHECK if needed).
--   p_session_id, p_instance_id, p_thought_id, p_payload, p_payout,
--   p_value_deltas, p_meta

DROP FUNCTION IF EXISTS public.settle_decision(uuid, uuid, text, jsonb, integer, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.settle_decision(uuid, uuid, text, jsonb, numeric, jsonb, jsonb);

CREATE FUNCTION public.settle_decision(
  p_session_id uuid,
  p_instance_id uuid,
  p_thought_id text,
  p_payload jsonb,
  p_payout numeric,
  p_value_deltas jsonb,
  p_meta jsonb
)
RETURNS TABLE (
  balance integer,
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
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  payout int := trunc(coalesce(p_payout, 0))::int; -- gold_ledger.amount as int
BEGIN
  -- p_payload / p_value_deltas / p_meta are available for audit triggers or
  -- future value_ledger writes; decision_events is already inserted by the client.

  UPDATE public.thought_instances AS ti
  SET settled_at = now()
  WHERE ti.id = p_instance_id
    AND ti.session_id = p_session_id
    AND ti.thought_id = p_thought_id
    AND ti.settled_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'thought_instances: not found, wrong session/thought, or already settled (id=%)',
      p_instance_id
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.gold_ledger (session_id, amount, entry_type)
  VALUES (p_session_id, payout, 'payout');

  RETURN QUERY
  SELECT
    public.get_session_gold(p_session_id)::integer AS balance,
    v.trust,
    v.altruism,
    v.deceit,
    v.greed,
    v.standing,
    v.trust_raw,
    v.altruism_raw,
    v.deceit_raw,
    v.greed_raw,
    v.trust_ema,
    v.altruism_ema,
    v.deceit_ema,
    v.greed_ema
  FROM public.get_session_values(p_session_id) AS v;
END;
$$;

COMMENT ON FUNCTION public.settle_decision(uuid, uuid, text, jsonb, numeric, jsonb, jsonb) IS
  'Mark thought instance settled, credit payout on gold_ledger, return balance + HUD values.';

GRANT EXECUTE ON FUNCTION public.settle_decision(uuid, uuid, text, jsonb, numeric, jsonb, jsonb)
  TO anon, authenticated, service_role;
