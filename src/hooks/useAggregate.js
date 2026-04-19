import { useState, useRef, useCallback, useEffect } from "react";
import { fetchAggregate } from "../lib/supabaseClient";

const AGGREGATE_PROX_DEBOUNCE_MS = 400;
const AGGREGATE_SKIP_MS = 45_000;

export function useAggregate() {
  const [aggregate, setAggregate] = useState({});
  const [aggregateLoading, setAggregateLoading] = useState({});

  const aggregateRef = useRef(aggregate);
  aggregateRef.current = aggregate;

  const lastFetchRef = useRef({});
  const timerRef = useRef({});
  const inFlightCountRef = useRef({});

  useEffect(() => {
    return () => {
      Object.values(timerRef.current).forEach(clearTimeout);
      timerRef.current = {};
    };
  }, []);

  const runAggregateFetch = useCallback((id, { force = false } = {}) => {
    if (!id || id === "exit") return;

    if (!force) {
      const lastAt = lastFetchRef.current[id];
      const cached = aggregateRef.current[id];
      if (
        lastAt != null &&
        cached != null &&
        performance.now() - lastAt < AGGREGATE_SKIP_MS
      ) {
        return;
      }
    }

    const busy = (inFlightCountRef.current[id] ?? 0) > 0;
    if (!force && busy) {
      return;
    }

    inFlightCountRef.current[id] = (inFlightCountRef.current[id] ?? 0) + 1;
    const startedCount = inFlightCountRef.current[id];
    if (startedCount === 1) {
      setAggregateLoading((prev) => ({ ...prev, [id]: true }));
    }

    void fetchAggregate(id)
      .then((data) => {
        setAggregate((prev) => ({ ...prev, [id]: data ?? null }));
        if (data != null) {
          lastFetchRef.current[id] = performance.now();
        }
      })
      .catch((err) => console.error("fetchAggregate", id, err))
      .finally(() => {
        inFlightCountRef.current[id] = Math.max(
          0,
          (inFlightCountRef.current[id] ?? 1) - 1,
        );
        if (inFlightCountRef.current[id] === 0) {
          setAggregateLoading((prev) => ({ ...prev, [id]: false }));
        }
      });
  }, []);

  const cancelDebounce = useCallback((id) => {
    const t = timerRef.current[id];
    if (t != null) {
      clearTimeout(t);
      delete timerRef.current[id];
    }
  }, []);

  const scheduleFetch = useCallback(
    (id) => {
      if (!id || id === "exit") return;
      cancelDebounce(id);
      timerRef.current[id] = window.setTimeout(() => {
        delete timerRef.current[id];
        runAggregateFetch(id, { force: false });
      }, AGGREGATE_PROX_DEBOUNCE_MS);
    },
    [cancelDebounce, runAggregateFetch],
  );

  const handlePortalProximity = useCallback(
    (id, isNear) => {
      if (id === "exit") return;
      if (!isNear) {
        cancelDebounce(id);
        return;
      }
      scheduleFetch(id);
    },
    [scheduleFetch, cancelDebounce],
  );

  const refreshAggregate = useCallback(
    (id) => {
      cancelDebounce(id);
      runAggregateFetch(id, { force: true });
    },
    [cancelDebounce, runAggregateFetch],
  );

  return {
    aggregate,
    aggregateLoading,
    handlePortalProximity,
    refreshAggregate,
  };
}
