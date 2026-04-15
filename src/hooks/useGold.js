import { useCallback, useMemo, useState } from "react";
import {
  createRunSession,
  fetchGold,
  settleDecision,
  startInstance,
} from "../lib/supabaseClient";
import { payoutForDecision, stakeForThought } from "../lib/gold";
import { classifyOutcome } from "../lib/values";

const SESSION_STORAGE_KEY = "tv_run_session_id";

export function useGold() {
  const [runSessionId, setRunSessionId] = useState(null);
  const [balance, setBalance] = useState(0);
  const [instancesByThought, setInstancesByThought] = useState({});
  const [goldLoading, setGoldLoading] = useState(false);

  const initSession = useCallback(async (seedGold = 50) => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return null;
    }

    const cached = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (cached) {
      setRunSessionId(cached);
      try {
        const currentBalance = await fetchGold(cached);
        setBalance(currentBalance);
        return cached;
      } catch {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        setRunSessionId(null);
        return null;
      }
    }

    setGoldLoading(true);
    try {
      const row = await createRunSession(seedGold);
      if (!row) return null;
      const nextRunSessionId = row.run_session_id;
      setRunSessionId(nextRunSessionId);
      setBalance(Number(row.balance) || 0);
      window.localStorage.setItem(SESSION_STORAGE_KEY, nextRunSessionId);
      return nextRunSessionId;
    } finally {
      setGoldLoading(false);
    }
  }, []);

  const startThoughtInstance = useCallback(
    async (thoughtId) => {
      if (!thoughtId || thoughtId === "exit") return null;

      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        return null;
      }

      const existing = instancesByThought[thoughtId];
      if (existing) return existing;

      let nextRunSessionId = runSessionId;
      if (!nextRunSessionId) {
        nextRunSessionId = await initSession();
      }
      if (!nextRunSessionId) return null;

      const stake = stakeForThought(thoughtId);
      const row = await startInstance(nextRunSessionId, thoughtId, stake);
      if (!row) return null;

      const instanceId = row.instance_id;
      setInstancesByThought((prev) => ({ ...prev, [thoughtId]: instanceId }));
      setBalance(Number(row.balance) || 0);
      return instanceId;
    },
    [initSession, instancesByThought, runSessionId],
  );

  const settleThought = useCallback(
    async ({ thoughtId, decisionValue, outcomeMeta, payload }) => {
      if (!thoughtId || thoughtId === "exit") return null;
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        return null;
      }

      let nextRunSessionId = runSessionId;
      if (!nextRunSessionId) {
        nextRunSessionId = await initSession();
      }
      if (!nextRunSessionId) return null;

      let instanceId = instancesByThought[thoughtId];
      if (!instanceId) {
        instanceId = await startThoughtInstance(thoughtId);
      }
      if (!instanceId) return null;

      const classified = classifyOutcome(thoughtId, decisionValue, outcomeMeta);
      const payout = classified?.goldPayout ?? payoutForDecision(thoughtId, decisionValue, outcomeMeta);
      const row = await settleDecision({
        runSessionId: nextRunSessionId,
        instanceId,
        thought: thoughtId,
        payload,
        payout,
        valueDeltas: classified?.valueDeltas,
        meta: {
          label: classified?.label ?? "neutral",
          outcomeMeta: outcomeMeta ?? {},
        },
      });

      if (row && typeof row.balance !== "undefined") {
        setBalance(Number(row.balance) || 0);
      }

      setInstancesByThought((prev) => {
        const next = { ...prev };
        delete next[thoughtId];
        return next;
      });

      return row;
    },
    [initSession, instancesByThought, runSessionId, startThoughtInstance],
  );

  return useMemo(
    () => ({
      runSessionId,
      balance,
      goldLoading,
      instancesByThought,
      initSession,
      startThoughtInstance,
      settleThought,
    }),
    [
      runSessionId,
      balance,
      goldLoading,
      instancesByThought,
      initSession,
      startThoughtInstance,
      settleThought,
    ],
  );
}
