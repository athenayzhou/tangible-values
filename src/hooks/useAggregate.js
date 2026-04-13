import { useState, useRef, useCallback, useEffect } from "react";

import {
  insertDecision,
  fetchAggregate,
  buildDecisionPayload,
} from "../lib/supabaseClient";

const AGGREGATE_PROX_DEBOUNCE_MS = 400;
const AGGREGATE_SKIP_MS = 45_000;

const initialSubmissions = {
  dictator: { submitted: false, decisionValue: null },
  volunteer: { submitted: false, decisionValue: null },
  exchange: { submitted: false, decisionValue: null },
  trust: { submitted: false, decisionValue: null },
};

export function useAggregate() {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [aggregate, setAggregate] = useState({});
  const [aggregateLoading, setAggregateLoading] = useState({});

  const aggregateRef = useRef(aggregate);
  aggregateRef.current = aggregate;

  const lastAggregateFetchAtRef = useRef({});
  const proximityDebounceTimersRef = useRef({});

  useEffect(() => {
    return () => {
      const timers = proximityDebounceTimersRef.current;
      for (const t of Object.values(timers)) {
        clearTimeout(t);
      }
      proximityDebounceTimersRef.current = {};
    };
  }, []);

  const runAggregateFetch = useCallback((id, options = {}) => {
    const force = options.force === true;
    if (!id || id === "exit") return;

    const now = performance.now();
    if (!force) {
      const lastAt = lastAggregateFetchAtRef.current[id];
      const cached = aggregateRef.current[id];
      if (
        lastAt != null &&
        cached != null &&
        now - lastAt < AGGREGATE_SKIP_MS
      ) {
        return;
      }
    }

    setAggregateLoading((prev) => ({ ...prev, [id]: true }));
    void fetchAggregate(id)
      .then((data) => {
        if (data != null) {
          setAggregate((prev) => ({ ...prev, [id]: data }));
          lastAggregateFetchAtRef.current[id] = performance.now();
        }
      })
      .catch((err) => console.error("fetchAggregate", id, err))
      .finally(() =>
        setAggregateLoading((prev) => ({ ...prev, [id]: false })),
      );
  }, []);

  const cancelProximityAggregateDebounce = useCallback((id) => {
    const timers = proximityDebounceTimersRef.current;
    if (id != null && timers[id] != null) {
      clearTimeout(timers[id]);
      delete timers[id];
    }
  }, []);

  const scheduleProximityAggregateFetch = useCallback(
    (id) => {
      if (!id || id === "exit") return;
      const timers = proximityDebounceTimersRef.current;
      if (timers[id] != null) {
        clearTimeout(timers[id]);
      }
      timers[id] = window.setTimeout(() => {
        delete timers[id];
        runAggregateFetch(id, { force: false });
      }, AGGREGATE_PROX_DEBOUNCE_MS);
    },
    [runAggregateFetch],
  );

  const storeSubmissions = useCallback(
    (key, submitState) => {
      const decisionValue =
        typeof submitState === "object" && submitState !== null
          ? submitState.decisionValue
          : submitState;

      setSubmissions((prev) => ({
        ...prev,
        [key]: {
          submitted: true,
          decisionValue,
        },
      }));

      const payload = buildDecisionPayload(key, decisionValue);
      void insertDecision(key, payload)
        .then(() => {
          cancelProximityAggregateDebounce(key);
          runAggregateFetch(key, { force: true });
        })
        .catch((err) => console.error("insertDecision", key, err));
    },
    [runAggregateFetch, cancelProximityAggregateDebounce],
  );

  const handlePortalProximity = useCallback(
    (id, isNear) => {
      if (id === "exit") return;
      if (!isNear) {
        cancelProximityAggregateDebounce(id);
        return;
      }
      scheduleProximityAggregateFetch(id);
    },
    [scheduleProximityAggregateFetch, cancelProximityAggregateDebounce],
  );

  return {
    submissions,
    storeSubmissions,
    aggregate,
    aggregateLoading,
    handlePortalProximity,
  };
}
