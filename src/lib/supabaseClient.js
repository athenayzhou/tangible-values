import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const AGGREGATE_RPC = "aggregate_for_thought";

export const supabase = url && key ? createClient(url, key) : null;

export async function createRunSession(seedGold = 50){
  if(!supabase) return null;
  const { data, error } = await supabase.rpc("create_run_session", { p_seed_gold: seedGold });
  if(error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function startInstance(runSessionId, thoughtId, stake){
  if(!supabase) return null;
  const { data, error } = await supabase.rpc("start_instance", {
    p_run_session_id: runSessionId,
    p_thought: thoughtId,
    p_stake: stake,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function recordActionCost(runSessionId, instanceId, cost, reason = "action"){
  if(!supabase) return null;
  const { data, error } = await supabase.rpc("record_action_cost", {
    p_run_session_id: runSessionId,
    p_instance_id: instanceId,
    p_cost: cost,
    p_reason: reason,
  });
  if(error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function settleDecision({
  runSessionId, instanceId, thought, payload, payout,
  valueDeltas = { trust: 0, altruism: 0, deceit: 0, greed: 0 },
  meta = {},
}){
  if(!supabase) return null;
  const { data, error } = await supabase.rpc("submit_decision_and_settle", {
    p_run_session_id: runSessionId,
    p_instance_id: instanceId,
    p_thought: thought,
    p_payload: payload,
    p_payout: payout,
    p_value_deltas: valueDeltas,
    p_meta: meta,
  });
  if(error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function fetchGold(runSessionId){
  if(!supabase) return 0;
  const { data, error } = await supabase.rpc("get_gold_balance", {
    p_run_session_id: runSessionId,
  });
  if(error) throw error;
  return Number(data) || 0;
}

export async function fetchValues(runSessionId){
  if(!supabase) return null;
  const { data, error } = await supabase.rpc("get_value_stats", {
    p_run_session_id: runSessionId,
  });
  if(error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function insertDecision(thought, payload, options = {}) {
  if (!supabase) return;
  const baseRow = { thought, payload };
  const extendedRow = {
    ...baseRow,
    run_session_id: options.runSessionId ?? null,
    instance_id: options.instanceId ?? null,
  };

  const { error } = await supabase.from("decision_events").insert(extendedRow);
  if (!error) return;

  const isMissingColumnError =
    typeof error.message === "string" &&
    (error.message.includes("run_session_id") ||
      error.message.includes("instance_id"));

  if (!isMissingColumnError) {
    throw error;
  }

  const fallback = await supabase.from("decision_events").insert(baseRow);
  if (fallback.error) throw fallback.error;
}

function normalizeAggregate(data) {
  let row = data;
  if (row == null) return null;
  if (typeof row === "string") {
    try {
      row = JSON.parse(row);
    } catch {
      return null;
    }
  }
  if (Array.isArray(row)) {
    row = row.length > 0 ? row[0] : null;
  }
  if (row == null || typeof row !== "object") return row;
  const keys = Object.keys(row);
  if (keys.length === 1) {
    const inner = row[keys[0]];
    if (inner != null && typeof inner === "object") {
      row = Array.isArray(inner)
        ? inner.length > 0
          ? inner[0]
          : null
        : inner;
    }
  }
  return row;
}

export async function fetchAggregate(thought) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc(AGGREGATE_RPC, {
    p_thought: thought,
  });
  if (error) throw error;
  return normalizeAggregate(data);
}

export function buildDecisionPayload(thought, decisionValue, outcomeMeta = {}) {
  switch (thought) {
    case "dictator":
      return { receiver_coins: Number(decisionValue) };
    case "volunteer":
      return {
        majority: String(decisionValue),
        confed_choices: Array.isArray(outcomeMeta.confedChoices)
          ? outcomeMeta.confedChoices
          : [],
      };
    case "exchange":
      return {
        choice: decisionValue ? "exchange" : "deceive",
        confed_choice: outcomeMeta.confedChoice ? "exchange" : "deceive",
      };
    case "trust":
      return {
        sent: Number(decisionValue),
        returned: Number(outcomeMeta.returned ?? 0),
      };
    default:
      return {};
  }
}
