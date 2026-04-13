import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

const AGGREGATE_RPC = "aggregate_for_thought";

export const supabase = url && key ? createClient(url, key) : null;

export async function insertDecision(thought, payload) {
  if (!supabase) return;
  const { error } = await supabase
    .from("decision_events")
    .insert({ thought, payload });
  if (error) throw error;
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

export function buildDecisionPayload(thought, decisionValue) {
  switch (thought) {
    case "dictator":
      return { receiver_coins: Number(decisionValue) };
    case "volunteer":
      return { majority: String(decisionValue) };
    case "exchange":
      return { choice: decisionValue ? "exchange" : "keep" };
    case "trust":
      return { sent: Number(decisionValue) };
    default:
      return {};
  }
}
