-- Atomic canonical settle: validates open instance, computes outcome server-side,
-- writes decision event + payout ledger, marks instance settled, returns HUD snapshot.
--
-- Repeat damping: prior settlements in the same session+thought within DAMP_WINDOW
-- with the same "pattern" scale trust/altruism/deceit/greed deltas (gold payout unchanged).
-- dictator: pattern = same receiver_coins (outcome_label is shared for all dictator rows).

DROP FUNCTION IF EXISTS public.settle_decision(uuid, uuid, text, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.settle_decision(uuid, uuid, text, jsonb, integer, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.settle_decision(uuid, uuid, text, jsonb, numeric, jsonb, jsonb);

CREATE FUNCTION public.settle_decision(
  p_session_id uuid,
  p_instance_id uuid,
  p_thought_id text,
  p_payload jsonb,
  p_meta jsonb DEFAULT '{}'::jsonb
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
  greed_ema double precision,
  stake integer,
  payout integer,
  net integer,
  outcome_label text,
  prior_count integer,
  value_damp_multiplier double precision,
  value_deltas jsonb
)
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  v_stake int := 0;
  v_payout int := 0;
  v_net int := 0;
  v_label text := 'neutral';

  v_trust int := 0;
  v_altruism int := 0;
  v_deceit int := 0;
  v_greed int := 0;

  v_receiver int := 0;
  v_choice int := 0;
  v_sent int := 0;
  v_returned int := 0;
  v_player_choice text := 'deceive';
  v_confed_choice text := 'deceive';
  v_has_any_one boolean := false;

  v_values jsonb;

  -- Damping: tune DAMP_ALPHA / DAMP_FLOOR / window here.
  v_prior int := 0;
  v_damp numeric := 1.0;
  DAMP_WINDOW interval := interval '36 hours';
  DAMP_ALPHA numeric := 0.35;
  DAMP_FLOOR numeric := 0.35;
BEGIN
  -- Lock + validate open instance, capture canonical stake.
  UPDATE public.thought_instances AS ti
  SET settled_at = now()
  WHERE ti.id = p_instance_id
    AND ti.session_id = p_session_id
    AND ti.thought_id = p_thought_id
    AND ti.settled_at IS NULL
  RETURNING coalesce(ti.stake_amount, 0)::int INTO v_stake;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'thought instance not found, wrong session/thought, or already settled (id=%)',
      p_instance_id
      USING ERRCODE = 'P0001';
  END IF;

  -- Canonical payout + value deltas.
  IF p_thought_id = 'dictator' THEN
    v_receiver :=
      CASE
        WHEN coalesce(p_payload->>'receiver_coins', '') ~ '^-?\d+$'
          THEN (p_payload->>'receiver_coins')::int
        ELSE 0
      END;
    v_receiver := greatest(0, least(10, v_receiver));
    v_payout := 10 - v_receiver;
    v_label := 'dictator_settle';

    IF v_payout >= 8 THEN
      v_greed := v_greed + 2;
    ELSIF v_payout >= 5 THEN
      v_greed := v_greed + 1;
    END IF;

  ELSIF p_thought_id = 'volunteer' THEN
    v_choice :=
      CASE
        WHEN coalesce(p_payload->>'majority', '') ~ '^-?\d+$'
          THEN (p_payload->>'majority')::int
        ELSE 5
      END;

    SELECT EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(coalesce(p_payload->'confed_choices', '[]'::jsonb)) AS x(val)
      WHERE x.val ~ '^-?\d+$' AND x.val::int = 1
    ) INTO v_has_any_one;

    IF v_choice = 1 THEN
      v_payout := 1;
      IF v_has_any_one THEN
        v_altruism := v_altruism + 2;
        v_label := 'volunteer_1_1';
      ELSE
        v_altruism := v_altruism + 3;
        v_label := 'volunteer_1_5';
      END IF;
    ELSE
      IF v_has_any_one THEN
        v_payout := 5;
        v_greed := v_greed + 1;
        v_label := 'volunteer_5_1';
      ELSE
        v_payout := 0;
        v_greed := v_greed + 2;
        v_label := 'volunteer_5_5';
      END IF;
    END IF;

  ELSIF p_thought_id = 'trust' THEN
    v_sent :=
      CASE
        WHEN coalesce(p_payload->>'sent', '') ~ '^-?\d+$'
          THEN (p_payload->>'sent')::int
        ELSE 0
      END;
    v_returned :=
      CASE
        WHEN coalesce(p_payload->>'returned', '') ~ '^-?\d+$'
          THEN (p_payload->>'returned')::int
        ELSE 0
      END;

    v_sent := greatest(0, least(10, v_sent));
    v_returned := greatest(0, v_returned);
    v_payout := 10 - v_sent + v_returned;

    IF v_sent >= 5 AND v_returned >= v_sent THEN
      v_trust := v_trust + 2;
      v_altruism := v_altruism + 1;
      v_label := 'trust_high_high';
    ELSIF v_sent >= 5 AND v_returned < v_sent THEN
      v_trust := v_trust - 1;
      v_altruism := v_altruism + 2;
      v_label := 'trust_high_low';
    ELSIF v_sent < 5 AND v_returned >= v_sent THEN
      v_greed := v_greed + 1;
      v_label := 'trust_low_high';
    ELSE
      v_greed := v_greed + 2;
      v_trust := v_trust - 1;
      v_label := 'trust_low_low';
    END IF;

  ELSIF p_thought_id = 'exchange' THEN
    v_player_choice := lower(coalesce(p_payload->>'choice', 'deceive'));
    IF v_player_choice NOT IN ('exchange', 'deceive') THEN
      v_player_choice := 'deceive';
    END IF;

    v_confed_choice := lower(coalesce(p_payload->>'confed_choice', 'deceive'));
    IF v_confed_choice NOT IN ('exchange', 'deceive') THEN
      v_confed_choice := 'deceive';
    END IF;

    IF v_player_choice = 'deceive' AND v_confed_choice = 'deceive' THEN
      v_payout := 2;
      v_deceit := v_deceit + 1;
      v_greed := v_greed + 1;
      v_label := 'exchange_deceive_deceive';
    ELSIF v_player_choice = 'exchange' AND v_confed_choice = 'exchange' THEN
      v_payout := 5;
      v_trust := v_trust + 2;
      v_altruism := v_altruism + 1;
      v_label := 'exchange_honest_honest';
    ELSIF v_player_choice = 'deceive' AND v_confed_choice = 'exchange' THEN
      v_payout := 7;
      v_deceit := v_deceit + 2;
      v_greed := v_greed + 1;
      v_label := 'exchange_deceive_honest';
    ELSE
      v_payout := 0;
      v_trust := v_trust - 2;
      v_label := 'exchange_honest_deceive';
    END IF;
  ELSE
    RAISE EXCEPTION 'invalid p_thought_id: %', p_thought_id USING ERRCODE = 'P0001';
  END IF;

  -- Prior similar outcomes (this row not inserted yet).
  SELECT count(*)::int
  INTO v_prior
  FROM public.decision_events AS e
  WHERE e.session_id = p_session_id
    AND e.thought_id = p_thought_id
    AND e.created_at >= (now() - DAMP_WINDOW)
    AND (
      (
        p_thought_id = 'dictator'
        AND coalesce(e.payload->>'receiver_coins', '') ~ '^-?\d+$'
        AND (e.payload->>'receiver_coins')::int = v_receiver
      )
      OR (p_thought_id <> 'dictator' AND e.outcome_label = v_label)
    );

  v_damp := greatest(
    DAMP_FLOOR,
    1.0::numeric / (1.0::numeric + DAMP_ALPHA * v_prior::numeric)
  );

  v_trust := round(v_trust::numeric * v_damp)::int;
  v_altruism := round(v_altruism::numeric * v_damp)::int;
  v_deceit := round(v_deceit::numeric * v_damp)::int;
  v_greed := round(v_greed::numeric * v_damp)::int;

  v_values := jsonb_build_object(
    'trust', v_trust,
    'altruism', v_altruism,
    'deceit', v_deceit,
    'greed', v_greed
  );

  INSERT INTO public.decision_events (
    session_id,
    instance_id,
    thought_id,
    payload,
    value_deltas,
    outcome_label
  ) VALUES (
    p_session_id,
    p_instance_id,
    p_thought_id,
    coalesce(p_payload, '{}'::jsonb),
    v_values,
    v_label
  );

  INSERT INTO public.gold_ledger (session_id, amount, entry_type)
  VALUES (p_session_id, v_payout, 'payout');

  v_net := v_payout - v_stake;

  RETURN QUERY
  SELECT
    public.get_session_gold(p_session_id)::int AS balance,
    v2.trust,
    v2.altruism,
    v2.deceit,
    v2.greed,
    v2.standing,
    v2.trust_raw,
    v2.altruism_raw,
    v2.deceit_raw,
    v2.greed_raw,
    v2.trust_ema,
    v2.altruism_ema,
    v2.deceit_ema,
    v2.greed_ema,
    v_stake,
    v_payout,
    v_net,
    v_label,
    v_prior,
    v_damp::double precision,
    v_values
  FROM public.get_session_values(p_session_id) AS v2;
END;
$$;

GRANT EXECUTE ON FUNCTION public.settle_decision(uuid, uuid, text, jsonb, jsonb)
  TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';