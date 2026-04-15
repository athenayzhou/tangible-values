import { useState, useCallback } from "react";
import { insertDecision, buildDecisionPayload } from "../lib/supabaseClient";

const initialSubmissions = {
  dictator: { submitted: false, decisionValue: null, outcomeMeta: null },
  volunteer: { submitted: false, decisionValue: null, outcomeMeta: null },
  exchange: { submitted: false, decisionValue: null, outcomeMeta: null },
  trust: { submitted: false, decisionValue: null, outcomeMeta: null },
};

export function useSubmission() {
  const [submissions, setSubmissions] = useState(initialSubmissions);

  const storeSubmissions = useCallback(
    async (thoughtId, submitState, options = {}) => {
      const decisionValue =
        typeof submitState === "object" && submitState !== null
          ? submitState.decisionValue
          : submitState;

      const outcomeMeta =
        typeof submitState === "object" && submitState !== null
          ? submitState.outcomeMeta ?? null
          : null;

      setSubmissions((prev) => ({
        ...prev,
        [thoughtId]: { submitted: true, decisionValue, outcomeMeta },
      }));

      const payload = buildDecisionPayload(thoughtId, decisionValue, outcomeMeta);

      await insertDecision(thoughtId, payload, {
        runSessionId: options.runSessionId,
        instanceId: options.instanceId,
      });

      if (typeof options.onPersisted === "function") {
        await options.onPersisted({
          thoughtId,
          decisionValue,
          outcomeMeta,
          payload,
        });
      }
    },
    [],
  );

  return {
    submissions,
    storeSubmissions,
  };
}