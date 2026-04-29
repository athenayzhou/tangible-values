import { useCallback, useRef } from "react";
import { persistDictatorComplete } from "../lib/dictatorLock";
import {
  buildRecapPayload,
  pickStanding,
  persistPendingInstanceRecap,
  settleRefresh,
} from "../lib/settleRecap";

/**
 * @param {object} params
 * @param {(args: object) => Promise<{ row: object | null, sessionId: string } | undefined>} params.settleThought
 * @param {(thoughtId: string) => void} params.refreshAggregate
 * @param {(sessionId: string, settleRow?: object | null) => Promise<object | null>} params.refreshValues
 * @param {() => Promise<string | null>} params.initSession
 * @param {string | null} params.sessionId
 * @param {object} params.values
 * @param {(payload: object) => void} params.setRecap
 */
export function useSettle({
  settleThought,
  refreshAggregate,
  refreshValues,
  initSession,
  sessionId,
  values,
  setRecap,
}) {
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const recapBufferRef = useRef(null);

  const settle = useCallback(
    async ({ thoughtId: persistedThoughtId, decisionValue, outcomeMeta, payload }) => {
      const standingBefore = pickStanding(valuesRef.current);
      const { row: settleRow, sessionId: settledSessionId } =
        (await settleThought({
          thoughtId: persistedThoughtId,
          decisionValue,
          outcomeMeta,
          payload,
        })) ?? {};
      const settleOk = Boolean(settleRow);
      if (!settleOk) {
        console.error(
          "settleThought returned no row; values may be stale",
          persistedThoughtId,
        );
      }

      refreshAggregate(persistedThoughtId);
      const sessionForValues =
        settledSessionId || sessionIdRef.current || (await initSession());

      let nextValues = null;
      if (sessionForValues) {
        try {
          nextValues = await settleRefresh(
            refreshValues,
            sessionForValues,
            settleRow,
          );
        } catch {
          /* logged in settleRefresh */
        }
      }

      if (persistedThoughtId === "dictator" && sessionForValues) {
        persistDictatorComplete(sessionForValues);
      }

      const payloadRecap = buildRecapPayload({
        thoughtId: persistedThoughtId,
        standingBefore,
        settleRow,
        nextValues,
        settleOk,
      });

      if (persistedThoughtId === "dictator") {
        setRecap(payloadRecap);
      } else {
        recapBufferRef.current = payloadRecap;
        if (settleOk && sessionForValues) {
          persistPendingInstanceRecap(
            sessionForValues,
            persistedThoughtId,
            payloadRecap,
          );
        }
      }
    },
    [settleThought, refreshAggregate, refreshValues, initSession, setRecap],
  );

  return { settle, recapBufferRef };
}
