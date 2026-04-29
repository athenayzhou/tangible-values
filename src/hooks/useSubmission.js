import { useState, useCallback, useRef } from "react";
import { buildDecisionPayload } from "../lib/supabaseClient";
import { isDictatorLockedForSession } from "../lib/dictatorLock";

const initialSubmissions = {
  dictator: {
    submitted: false,
    decisionValue: null,
    outcomeMeta: null,
    status: "idle",
    error: null,
    instanceId: null,
  },
  volunteer: {
    submitted: false,
    decisionValue: null,
    outcomeMeta: null,
    status: "idle",
    error: null,
    instanceId: null,
  },
  exchange: {
    submitted: false,
    decisionValue: null,
    outcomeMeta: null,
    status: "idle",
    error: null,
    instanceId: null,
  },
  trust: {
    submitted: false,
    decisionValue: null,
    outcomeMeta: null,
    status: "idle",
    error: null,
    instanceId: null,
  },
};

export function useSubmission() {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const submissionsRef = useRef(submissions);
  submissionsRef.current = submissions;
  const retryCacheRef = useRef({});

  const hydrateDictatorLock = useCallback((sessionId) => {
    if (!sessionId || !isDictatorLockedForSession(sessionId)) return;
    setSubmissions((prev) => ({
      ...prev,
      dictator: {
        ...initialSubmissions.dictator,
        submitted: true,
        status: "settled",
        instanceId: null,
      },
    }));
  }, []);

  const beginSubmission = useCallback((thoughtId, instanceId) => {
    if (!thoughtId || thoughtId === "exit") return;
    const base = initialSubmissions[thoughtId] ?? initialSubmissions.dictator;
    setSubmissions((prev) => ({
      ...prev,
      [thoughtId]: {
        ...base,
        instanceId: instanceId ?? null,
        submitted: false,
        decisionValue: null,
        outcomeMeta: null,
        status: "idle",
        error: null,
      },
    }));
  }, []);

  const storeSubmissions = useCallback(
    async (thoughtId, submitState, options = {}) => {
      const decisionValue =
        typeof submitState === "object" && submitState !== null
          ? submitState.decisionValue
          : submitState;
      const outcomeMeta =
        typeof submitState === "object" && submitState !== null
          ? (submitState.outcomeMeta ?? null)
          : null;
      const previousThoughtState =
        submissionsRef.current[thoughtId] ?? initialSubmissions[thoughtId];

      if (
        thoughtId === "dictator" &&
        options.sessionId &&
        isDictatorLockedForSession(options.sessionId)
      ) {
        throw new Error("Dictator is already completed for this session.");
      }
      if (
        thoughtId !== "dictator" &&
        (options.instanceId == null || options.instanceId === "")
      ) {
        throw new Error(
          "No active instance for this thought — re-enter the portal.",
        );
      }
      if (
        thoughtId !== "dictator" &&
        previousThoughtState.instanceId != null &&
        options.instanceId != null &&
        previousThoughtState.instanceId !== options.instanceId
      ) {
        throw new Error(
          "Instance mismatch — re-enter the portal to start a new round.",
        );
      }

      const payload = buildDecisionPayload(
        thoughtId,
        decisionValue,
        outcomeMeta,
      );

      retryCacheRef.current[thoughtId] = {
        thoughtId,
        submitState: { decisionValue, outcomeMeta },
      };

      setSubmissions((prev) => ({
        ...prev,
        [thoughtId]: {
          ...prev[thoughtId],
          submitted: false,
          decisionValue,
          outcomeMeta,
          status: "submitting",
          error: null,
        },
      }));

      try {
        if (typeof options.onPersisted === "function") {
          await options.onPersisted({
            thoughtId,
            decisionValue,
            outcomeMeta,
            payload,
          });
        }
        setSubmissions((prev) => ({
          ...prev,
          [thoughtId]: {
            ...prev[thoughtId],
            submitted: true,
            status: "settled",
            error: null,
          },
        }));
      } catch (error) {
        setSubmissions((prev) => ({
          ...prev,
          [thoughtId]: {
            ...previousThoughtState,
            status: "failed",
            error: error?.message ?? "Submission failed",
          },
        }));
        throw error;
      }
    },
    [],
  );

  const retrySubmission = useCallback(
    async (thoughtId, options = {}) => {
      const cached = retryCacheRef.current[thoughtId];
      if (!cached) return null;
      return storeSubmissions(cached.thoughtId, cached.submitState, options);
    },
    [storeSubmissions],
  );

  return {
    submissions,
    storeSubmissions,
    retrySubmission,
    beginSubmission,
    hydrateDictatorLock,
  };
}
