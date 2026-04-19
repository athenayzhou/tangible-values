import { useCallback, useEffect, useRef } from "react";

export function useTimedStages() {
  const timersRef = useRef([]);

  const clearAll = useCallback(() => {
    for (const id of timersRef.current) {
      clearTimeout(id);
    }
    timersRef.current = [];
  }, []);

  const schedule = useCallback((delayMs, fn) => {
    const id = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, delayMs);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => clearAll, [clearAll]);

  return { schedule, clearAll };
}
