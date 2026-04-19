import { useCallback, useMemo, useState } from "react";
import {
  createSession,
  fetchGold,
  settleDecision,
  startInstance,
} from "../lib/supabaseClient";
import { payoutForDecision, stakeForThought } from "../lib/gold";
import { classifyOutcome } from "../lib/values";

const SESSION_STORAGE_KEY = "tv_session_id";

export function useGold() {
  const [sessionId, setSessionId] = useState(null);
  const [balance, setBalance] = useState(0);
  const [instancesByThought, setInstancesByThought] = useState({});
  const [goldLoading, setGoldLoading] = useState(false);

  const initSession = useCallback(async (seedGold = 0) => {
    if (
      !import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY
    ) {
      return null;
    }

    const cached = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (cached) {
      setSessionId(cached);
      try {
        const currentBalance = await fetchGold(cached);
        setBalance(currentBalance);
        return cached;
      } catch {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        setSessionId(null);
        return null;
      }
    }

    setGoldLoading(true);
    try {
      const row = await createSession(seedGold);
      if (!row) return null;
      const nextSessionId = row.session_id;
      setSessionId(nextSessionId);
      setBalance(Number(row.balance) || 0);
      window.localStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
      return nextSessionId;
    } finally {
      setGoldLoading(false);
    }
  }, []);

  const startThoughtInstance = useCallback(
    async (thoughtId) => {
      if (!thoughtId || thoughtId === "exit") return null;

      if (
        !import.meta.env.VITE_SUPABASE_URL ||
        !import.meta.env.VITE_SUPABASE_ANON_KEY
      ) {
        return null;
      }

      const existing = instancesByThought[thoughtId];
      if (existing) return existing;

      let nextSessionId = sessionId;
      if (!nextSessionId) {
        nextSessionId = await initSession();
      }
      if (!nextSessionId) return null;

      const stakeValue = Number(stakeForThought(thoughtId));
      const stake = Number.isFinite(stakeValue) ? stakeValue : 0;
      const row = await startInstance(nextSessionId, thoughtId, stake);
      if (!row) return null;

      const instanceId =
        row.instance_id ?? row.thought_instance_id ?? row.id ?? null;
      setInstancesByThought((prev) => ({ ...prev, [thoughtId]: instanceId }));
      setBalance(Number(row.balance) || 0);
      return instanceId;
    },
    [initSession, instancesByThought, sessionId],
  );

  const settleThought = useCallback(
    async ({ thoughtId, decisionValue, outcomeMeta, payload }) => {
      const fail = (sessionIdHint = null) => ({
        row: null,
        sessionId: sessionIdHint,
      });

      if (!thoughtId || thoughtId === "exit") return fail();
      if (
        !import.meta.env.VITE_SUPABASE_URL ||
        !import.meta.env.VITE_SUPABASE_ANON_KEY
      ) {
        return fail();
      }

      let nextSessionId = sessionId;
      if (!nextSessionId) {
        nextSessionId = await initSession();
      }
      if (!nextSessionId) return fail();

      let instanceId = instancesByThought[thoughtId];
      if (!instanceId) {
        instanceId = await startThoughtInstance(thoughtId);
      }
      if (!instanceId) return fail(nextSessionId);

      const classified = classifyOutcome(thoughtId, decisionValue, outcomeMeta);
      const payout =
        classified?.goldPayout ??
        payoutForDecision(thoughtId, decisionValue, outcomeMeta);
      const valueDeltas = classified?.valueDeltas ?? {
        trust: 0,
        altruism: 0,
        deceit: 0,
        greed: 0,
      };
      const row = await settleDecision({
        sessionId: nextSessionId,
        instanceId,
        thoughtId,
        payload,
        payout,
        valueDeltas,
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

      return { row, sessionId: nextSessionId };
    },
    [initSession, instancesByThought, sessionId, startThoughtInstance],
  );

  return useMemo(
    () => ({
      sessionId,
      balance,
      goldLoading,
      instancesByThought,
      initSession,
      startThoughtInstance,
      settleThought,
    }),
    [
      sessionId,
      balance,
      goldLoading,
      instancesByThought,
      initSession,
      startThoughtInstance,
      settleThought,
    ],
  );
}
