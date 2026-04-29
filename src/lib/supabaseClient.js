import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;

export async function createSession(seedGold = 0) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("create_session", {
    p_seed_gold: seedGold,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function startInstance(sessionId, thoughtId) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("start_instance", {
    p_session_id: sessionId,
    p_thought_id: thoughtId,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

/** Normalizes open_instances (SETOF) RPC: array, wrapped array, or single row object. */
function normalizeOpenInstanceRows(data) {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "string") {
    try {
      return normalizeOpenInstanceRows(JSON.parse(data));
    } catch {
      return [];
    }
  }
  if (typeof data === "object") {
    const keys = Object.keys(data);
    if (keys.length === 1) {
      const inner = data[keys[0]];
      if (Array.isArray(inner)) return inner;
    }
    for (const k of keys) {
      const inner = data[k];
      if (Array.isArray(inner) && inner.length > 0) {
        const first = inner[0];
        if (first && typeof first === "object") return inner;
      }
    }
    if (data.thought_id != null || data.instance_id != null) {
      return [data];
    }
  }
  return [];
}

export async function fetchInstance(sessionId) {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("open_instances", {
    p_session_id: sessionId,
  });
  if (error) throw error;
  return normalizeOpenInstanceRows(data);
}

export async function settleDecision({
  sessionId,
  instanceId,
  thoughtId,
  payload,
  meta = {},
}) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("settle_decision", {
    p_session_id: sessionId,
    p_instance_id: instanceId,
    p_thought_id: thoughtId,
    p_payload: payload,
    p_meta: meta,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function fetchGold(sessionId) {
  if (!supabase) return 0;
  const { data, error } = await supabase.rpc("get_session_gold", {
    p_session_id: sessionId,
  });
  if (error) throw error;
  return Number(data) || 0;
}

export async function fetchValues(sessionId) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_session_values", {
    p_session_id: sessionId,
  });
  if (error) throw error;
  return unwrapRpc(data);
}

export function unwrapRpc(data) {
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
      row = Array.isArray(inner) ? (inner.length > 0 ? inner[0] : null) : inner;
    }
  }
  return row;
}

function unwrapThoughtAggregateRpc(data) {
  let row = unwrapRpc(data);
  for (let depth = 0; depth < 8; depth += 1) {
    if (row == null) return null;
    if (typeof row !== "object") return row;
    const keys = Object.keys(row);
    if (keys.length !== 1) return row;
    const inner = row[keys[0]];
    if (inner == null) return null;
    if (typeof inner === "object") {
      row = Array.isArray(inner) ? (inner.length > 0 ? inner[0] : null) : inner;
      continue;
    }
    return inner;
  }
  return row;
}

export async function fetchAggregate(thoughtId) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_thought_aggregate", {
    p_thought_id: thoughtId,
  });
  if (error) throw error;
  return unwrapThoughtAggregateRpc(data);
}

export function buildDecisionPayload(
  thoughtId,
  decisionValue,
  outcomeMeta = {},
) {
  switch (thoughtId) {
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
