import { useCallback, useMemo, useState } from "react";
import { fetchValues } from "../lib/supabaseClient";

const defaultValues = {
  trust: 0,
  altruism: 0,
  deceit: 0,
  greed: 0,
  standing: 0,
}

export function useValues(){
  const [values, setValues] = useState(defaultValues);
  const [valuesLoading, setValuesLoading] = useState(false);

  const refreshValues = useCallback(async (runSessionId) => {
    if(!runSessionId) return null;
    if(!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY){
      return null;
    }

    setValuesLoading(true);
    try {
      const row = await fetchValues(runSessionId);
      if(!row) return null;

      const next = {
        trust: Number(row.trust_ema ?? row.trust ?? 0),
        altruism: Number(row.altruism_ema ?? row.altruism ?? 0),
        deceit: Number(row.deceit_ema ?? row.deceit ?? 0),
        greed: Number(row.greed_ema ?? row.greed ?? 0),
        standing: Number(row.standing ?? 0),
      };
      setValues(next);
      return next;
    } finally {
      setValuesLoading(false);
    }
  }, []);

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