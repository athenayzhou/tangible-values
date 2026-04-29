import { useCallback, useMemo, useState } from "react";
import {
  createSession,
  fetchGold,
  settleDecision,
  startInstance,
  fetchInstance,
} from "../lib/supabaseClient";

const SESSION_STORAGE_KEY = "tv_session_id";

function pickOpenInstanceRow(row) {
  if (!row || typeof row !== "object") return { tid: null, iid: null };
  const tid =
    row.thought_id ??
    row.thoughtId ??
    (typeof row.thought === "string" ? row.thought : null);
  const iid =
    row.instance_id ??
    row.instanceId ??
    row.thought_instance_id ??
    row.thoughtInstanceId ??
    row.id ??
    null;
  const tidStr = tid != null && tid !== "" ? String(tid).trim() : null;
  const iidStr = iid != null && iid !== "" ? String(iid).trim() : null;
  return { tid: tidStr, iid: iidStr };
}

export function useGold() {
  const [sessionId, setSessionId] = useState(null);
  const [balance, setBalance] = useState(0);
  const [instancesByThought, setInstancesByThought] = useState({});
  const [goldLoading, setGoldLoading] = useState(false);

  const hydrateOpenInstance = useCallback(async (sid) => {
    if (
      !sid ||
      !import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY
    ) {
      return { thoughtIds: [], instanceMap: {} };
    }
    try {
      const rows = await fetchInstance(sid);
      const instanceMap = {};
      const thoughtIds = [];
      for (const row of rows) {
        const { tid, iid } = pickOpenInstanceRow(row);
        if (!tid || !iid) continue;
        instanceMap[tid] = iid;
        thoughtIds.push(tid);
      }
      setInstancesByThought((prev) => ({ ...prev, ...instanceMap }));
      return { thoughtIds, instanceMap };
    } catch (err) {
      console.error("hydrateOpenInstance", sid, err);
      return { thoughtIds: [], instanceMap: {} };
    }
  }, []);

  const initSession = useCallback(
    async (seedGold = 0) => {
      if (
        !import.meta.env.VITE_SUPABASE_URL ||
        !import.meta.env.VITE_SUPABASE_ANON_KEY
      ) {
        return null;
      }

      const cached = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (cached) {
        try {
          const currentBalance = await fetchGold(cached);
          await hydrateOpenInstance(cached);
          setSessionId(cached);
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
        setInstancesByThought({});
        window.localStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
        return nextSessionId;
      } finally {
        setGoldLoading(false);
      }
    },
    [hydrateOpenInstance],
  );

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

      const row = await startInstance(nextSessionId, thoughtId);
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

      const row = await settleDecision({
        sessionId: nextSessionId,
        instanceId,
        thoughtId,
        payload,
        meta: {
          decisionValue,
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
      hydrateOpenInstance,
    }),
    [
      sessionId,
      balance,
      goldLoading,
      instancesByThought,
      initSession,
      startThoughtInstance,
      settleThought,
      hydrateOpenInstance,
    ],
  );
}
