import { stakeForThought } from "./gold";

/** Session-only: portaled recap if user refreshes before exit portal. */
export const PENDING_INSTANCE_RECAP_KEY = "tv_pending_instance_recap";

const LEGACY_RECAP_SKIP_KEY = "tv_skip_instance_recap";

export function persistPendingInstanceRecap(sessionId, thoughtId, recap) {
  if (typeof window === "undefined" || !sessionId || !thoughtId || !recap) {
    return;
  }
  try {
    try {
      window.localStorage.removeItem(LEGACY_RECAP_SKIP_KEY);
    } catch {
      /* ignore */
    }
    window.sessionStorage.setItem(
      PENDING_INSTANCE_RECAP_KEY,
      JSON.stringify({ sessionId, thoughtId, recap }),
    );
  } catch (err) {
    console.warn("persistPendingInstanceRecap", err);
  }
}

/** Returns recap payload and removes the key if it matches currentSessionId. */
export function takePendingInstanceRecap(currentSessionId) {
  if (typeof window === "undefined" || !currentSessionId) return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_INSTANCE_RECAP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.sessionId !== currentSessionId ||
      !parsed.recap
    ) {
      return null;
    }
    window.sessionStorage.removeItem(PENDING_INSTANCE_RECAP_KEY);
    return parsed.recap;
  } catch {
    try {
      window.sessionStorage.removeItem(PENDING_INSTANCE_RECAP_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function clearPendingInstanceRecapIfMatch(sessionId, thoughtId) {
  if (typeof window === "undefined" || !sessionId || !thoughtId) return;
  try {
    const raw = window.sessionStorage.getItem(PENDING_INSTANCE_RECAP_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.sessionId === sessionId &&
      parsed.thoughtId === thoughtId
    ) {
      window.sessionStorage.removeItem(PENDING_INSTANCE_RECAP_KEY);
    }
  } catch {
    try {
      window.sessionStorage.removeItem(PENDING_INSTANCE_RECAP_KEY);
    } catch {
      /* ignore */
    }
  }
}

export function pickStanding(row) {
  if (!row || typeof row !== "object") return 0;
  for (const k of [
    "standing",
    "standing_ema",
    "standing_score",
    "standingScore",
  ]) {
    const n = Number(row[k]);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export function pickFiniteInt(row, keys, fallback = 0) {
  if (!row || typeof row !== "object") return fallback;
  for (const key of keys) {
    const n = Number(row[key]);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return fallback;
}

export function normalizeValueDeltas(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    trust: Math.trunc(Number(src.trust) || 0),
    altruism: Math.trunc(Number(src.altruism) || 0),
    deceit: Math.trunc(Number(src.deceit) || 0),
    greed: Math.trunc(Number(src.greed) || 0),
  };
}

export function buildRecapPayload({
  thoughtId,
  standingBefore,
  settleRow,
  nextValues,
  settleOk,
}) {
  const stake = pickFiniteInt(
    settleRow,
    ["stake"],
    Number(stakeForThought(thoughtId) || 0),
  );
  const payout = pickFiniteInt(settleRow, ["payout"], 0);
  const net = pickFiniteInt(settleRow, ["net"], payout - stake);

  const valueDeltas = normalizeValueDeltas(settleRow?.value_deltas);
  const valueDampMultiplier = Number(settleRow?.value_damp_multiplier);
  const priorCount = Number(settleRow?.prior_count);

  const standingAfter = nextValues
    ? pickStanding(nextValues)
    : pickStanding(settleRow);

  return {
    thoughtId,
    stake,
    payout,
    net,
    valueDeltas,
    valueDampMultiplier: Number.isFinite(valueDampMultiplier) ? valueDampMultiplier : null,
    priorCount: Number.isFinite(priorCount) ? priorCount : null,
    outcomeLabel: settleRow?.outcome_label ?? "neutral",
    standingBefore: Number(standingBefore) || 0,
    standingAfter,
    saveStatus: settleOk ? "saved" : "partial",
  };
}

const SETTLE_REFRESH_ATTEMPTS = 5;
const SETTLE_REFRESH_GAP_MS = 70;

export async function settleRefresh(
  refreshValues,
  sessionId,
  settleRow,
) {
  let last = null;
  for (let i = 0; i < SETTLE_REFRESH_ATTEMPTS; i += 1) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, SETTLE_REFRESH_GAP_MS));
    }
    try {
      last = await refreshValues(sessionId, settleRow);
      if (last) return last;
    } catch (err) {
      if (i === SETTLE_REFRESH_ATTEMPTS - 1) {
        console.error("refreshValues after settle", err);
        throw err;
      }
    }
  }
  return last;
}
