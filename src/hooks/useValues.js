import { useCallback, useMemo, useState } from "react";
import { fetchValues } from "../lib/supabaseClient";

function pickFiniteNumber(row, keys, fallback = 0) {
  for (const key of keys) {
    if (row == null || key == null) continue;
    const v = row[key];
    if (v == null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function flatOverlay(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return null;
  const out = { ...snapshot };
  for (const [, v] of Object.entries(snapshot)) {
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, v);
    }
  }
  return out;
}

function settleOverlay(snapshot) {
  const flat = flatOverlay(snapshot);
  if (!flat) return null;
  const keys = [
    "trust",
    "altruism",
    "deceit",
    "greed",
    "standing",
    "trust_ema",
    "altruism_ema",
    "deceit_ema",
    "greed_ema",
    "standing_ema",
    "standing_score",
    "standingScore",
    "trust_total",
    "altruism_total",
    "deceit_total",
    "greed_total",
    "trust_score",
    "trustScore",
    "altruism_score",
    "altruismScore",
    "deceit_score",
    "deceitScore",
    "greed_score",
    "greedScore",
  ];
  const o = {};
  for (const k of keys) {
    if (flat[k] == null || flat[k] === "") continue;
    const n = Number(flat[k]);
    if (Number.isFinite(n)) o[k] = flat[k];
  }
  for (const [k, v] of Object.entries(flat)) {
    if (o[k] != null) continue;
    if (v == null || v === "" || typeof v === "object") continue;
    const n = Number(v);
    if (
      Number.isFinite(n) &&
      /trust|altruism|deceit|greed|standing|ema|score/i.test(k)
    ) {
      o[k] = v;
    }
  }
  return Object.keys(o).length ? o : null;
}

function mergeRows(fetched, overlay) {
  if (fetched && typeof fetched === "object") {
    if (!overlay || typeof overlay !== "object") return fetched;
    const out = { ...fetched };
    for (const [k, v] of Object.entries(overlay)) {
      const n = Number(v);
      if (Number.isFinite(n)) out[k] = v;
    }
    return out;
  }
  if (overlay && typeof overlay === "object") return { ...overlay };
  return null;
}

const defaultValues = {
  trust: 0,
  altruism: 0,
  deceit: 0,
  greed: 0,
  standing: 0,
};

export function useValues() {
  const [values, setValues] = useState(defaultValues);
  const [valuesLoading, setValuesLoading] = useState(false);

  const refreshValues = useCallback(
    async (sessionId, settleSnapshot = null) => {
      if (!sessionId) return null;
      if (
        !import.meta.env.VITE_SUPABASE_URL ||
        !import.meta.env.VITE_SUPABASE_ANON_KEY
      ) {
        return null;
      }

      setValuesLoading(true);
      try {
        const fetched = await fetchValues(sessionId);
        const overlay = settleOverlay(settleSnapshot);
        const row = mergeRows(fetched, overlay);

        if (!row || typeof row !== "object") {
          if (import.meta.env.DEV) {
            console.warn("get_session_values: no row for session", sessionId, {
              fetched,
              settleSnapshot,
            });
          }
          return null;
        }

        const next = {
          trust: pickFiniteNumber(row, [
            "trust",
            "trust_ema",
            "trust_score",
            "trustScore",
            "trust_total",
          ]),
          altruism: pickFiniteNumber(row, [
            "altruism",
            "altruism_ema",
            "altruism_score",
            "altruismScore",
            "altruism_total",
          ]),
          deceit: pickFiniteNumber(row, [
            "deceit",
            "deceit_ema",
            "deceit_score",
            "deceitScore",
            "deceit_total",
          ]),
          greed: pickFiniteNumber(row, [
            "greed",
            "greed_ema",
            "greed_score",
            "greedScore",
            "greed_total",
          ]),
          standing: pickFiniteNumber(row, [
            "standing",
            "standing_ema",
            "standing_score",
            "standingScore",
          ]),
        };
        setValues(next);
        return next;
      } catch (err) {
        console.error("refreshValues", sessionId, err);
        throw err;
      } finally {
        setValuesLoading(false);
      }
    },
    [],
  );

  const resetValuesLocal = useCallback(() => {
    setValues(defaultValues);
  }, []);

  return useMemo(
    () => ({
      values,
      valuesLoading,
      refreshValues,
      resetValuesLocal,
    }),
    [values, valuesLoading, refreshValues, resetValuesLocal],
  );
}
