import { unwrapRpc } from "./supabaseClient";

function num(x, fallback = null){
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

/** @returns {"cooperative" | "cautious" | "mixed" | null} */

export function socialMood(thoughtId, rawAggregate){
  const a = unwrapRpc(rawAggregate);
  if(!a || typeof a !== "object") return null;

  const n = num(a.n ?? a.total ?? a.count, 0);
  if(n === 0) return null;

  switch (thoughtId){
    case "dictator":{
      const given = num(a.mean_given ?? a.avg_given ?? a.meanGiven, null);
      const kept = num(a.mean_kept ?? a.avg_kept ?? a.meanKept, null) ??
        (given != null ? 10 - given : null);
      if(given == null && kept == null) return null;
      if(given != null && given >= 5.5) return "cooperative";
      if(kept != null && kept >= 6) return "cautious";
      return "mixed";
    }

    case "volunteer": {
      const one = num(a.pct_one, null);
      const five = num(a.pct_five, null);
      if(one == null || five == null) return "mixed";
      if(one >= 58) return "cooperative";
      if(five >= 58) return "cautious";
      return "mixed";
    }

    case "exchange": {
      const ex = num(a.pct_exchange, null);
      const kp = num(a.pct_keep, null);
      if(ex == null || kp == null) return "mixed";
      if(ex >= 55) return "cooperative";
      if(kp >= 55) return "cautious";
      return "mixed";
    }

    case "trust": {
      const sent = num(a.mean_sent ?? a.avg_sent, null);
      if(sent == null) return null;
      if(sent >= 6) return "cooperative";
      if(sent <= 4) return "cautious";
      return "mixed";
    }

    default:
      return null;
  }
}