import {
  decideExchange,
  decideVolunteer,
  decideTrust,
} from "./confederate";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pctToRatio(pct) {
  const p = toNumber(pct);
  if (p == null) return null;
  return clamp(p / 100, 0, 1);
}

function bayesProb(successes, failures, priorAlpha = 1, priorBeta = 1) {
  const s = Math.max(0, successes);
  const f = Math.max(0, failures);
  const alpha = priorAlpha + s;
  const beta = priorBeta + f;
  return alpha / (alpha + beta);
}

function confidenceFromN(n, maxN = 200) {
  const v = clamp((Number(n) || 0) / maxN, 0, 1);
  return v;
}

function inferBinaryFromMajority(
  majorityChoice,
  majorityPct,
  positiveLabel,
  negativeLabel,
  assumedN = 20,
) {
  const p = pctToRatio(majorityPct);
  if (p == null) return null;
  const choice = String(majorityChoice ?? "")
    .trim()
    .toLowerCase();
  if (choice !== positiveLabel && choice !== negativeLabel) return null;
  const positive = choice === positiveLabel ? p : 1 - p;
  const successes = Math.round(positive * assumedN);
  const failures = Math.max(0, assumedN - successes);
  return { successes, failures, n: assumedN, source: "majority" };
}

export function getVolunteerProb(aggregate) {
  //want P(confed chooses 1). prefer counts -> then pct -> then majority inference

  let successes = null;
  let failures = null;
  let n = 0;
  let source = "default";

  const countOne = toNumber(aggregate?.count_one ?? aggregate?.cnt_one);
  const countFive = toNumber(aggregate?.count_five ?? aggregate?.cnt_five);

  if (countOne != null && countFive != null) {
    successes = countOne;
    failures = countFive;
    n = countOne + countFive;
    source = "counts";
  } else {
    const pctOne = pctToRatio(aggregate?.pct_one);
    if (pctOne != null) {
      const assumedN = 20;
      successes = Math.round(pctOne * assumedN);
      failures = assumedN - successes;
      n = assumedN;
      source = "pct";
    } else {
      const inferred = inferBinaryFromMajority(
        aggregate?.majority_choice ?? aggregate?.majority,
        aggregate?.majority_pct ?? aggregate?.majority_percent,
        "1",
        "5",
      );
      if (inferred) {
        successes = inferred.successes;
        failures = inferred.failures;
        n = inferred.n;
        source = inferred.source;
      }
    }
  }

  const pRaw =
    successes == null || failures == null
      ? 0.5
      : bayesProb(successes, failures, 2, 2);
  const pOne = clamp(pRaw, 0.05, 0.95);

  return {
    pOne,
    pFive: 1 - pOne,
    confidence: confidenceFromN(n),
    effectiveN: n,
    source,
  };
}

export function getExchangeProb(aggregate) {
  //want P(confed is honest/exchange)

  let successes = null;
  let failures = null;
  let n = 0;
  let source = "default";

  const countExchange = toNumber(
    aggregate?.count_exchange ?? aggregate?.cnt_exchange,
  );
  const countKeep = toNumber(aggregate?.count_keep ?? aggregate?.cnt_keep);

  if (countExchange != null && countKeep != null) {
    successes = countExchange;
    failures = countKeep;
    n = countExchange + countKeep;
    source = "counts";
  } else {
    const pctExchange = pctToRatio(aggregate?.pct_exchange);
    if (pctExchange != null) {
      const assumedN = 20;
      successes = Math.round(pctExchange * assumedN);
      failures = assumedN - successes;
      n = assumedN;
      source = "pct";
    } else {
      const inferred = inferBinaryFromMajority(
        aggregate?.majority_choice,
        aggregate?.majority_pct ?? aggregate?.majority_percent,
        "exchange",
        "keep",
      );
      if (inferred) {
        successes = inferred.successes;
        failures = inferred.failures;
        n = inferred.n;
        source = inferred.source;
      }
    }
  }

  const pRaw =
    successes == null || failures == null
      ? 0.5
      : bayesProb(successes, failures, 3, 3);
  const pHonest = clamp(pRaw, 0.05, 0.95);

  return {
    pHonest,
    pDeceive: 1 - pHonest,
    confidence: confidenceFromN(n),
    effectiveN: n,
    source,
  };
}

export function getTrustBaseline(aggregate) {
  const avgSent =
    toNumber(aggregate?.mean_sent) ??
    toNumber(aggregate?.avg_sent) ??
    toNumber(aggregate?.average_sent) ??
    toNumber(aggregate?.avg_amount_sent) ??
    toNumber(aggregate?.mean_amount_sent) ??
    toNumber(aggregate?.avg_of_sent);

  const n =
    toNumber(aggregate?.n) ??
    toNumber(aggregate?.total) ??
    toNumber(aggregate?.count) ??
    toNumber(aggregate?.row_count) ??
    20;

  // Prefer return-behavior indicators when available.
  const returnFactorDirect =
    toNumber(aggregate?.mean_return_factor) ??
    toNumber(aggregate?.avg_return_factor) ??
    toNumber(aggregate?.mean_return_ratio) ??
    toNumber(aggregate?.avg_return_ratio);

  const meanReturned =
    toNumber(aggregate?.mean_returned) ??
    toNumber(aggregate?.avg_returned) ??
    toNumber(aggregate?.average_returned);

  if (returnFactorDirect != null) {
    return {
      returnFactor: clamp(returnFactorDirect, 0.15, 2.5),
      confidence: confidenceFromN(n),
      effectiveN: n,
      source: "return_factor",
    };
  }

  if (meanReturned != null && avgSent != null && avgSent > 0) {
    return {
      returnFactor: clamp(meanReturned / avgSent, 0.15, 2.5),
      confidence: confidenceFromN(n),
      effectiveN: n,
      source: "returned_over_sent",
    };
  }

  // Fallback to sent-based trust climate only when return behavior is absent.
  if (avgSent == null) {
    return {
      returnFactor: 1.0,
      confidence: 0,
      effectiveN: 0,
      source: "default",
    };
  }

  const normalized = clamp(avgSent / 10, 0, 1);
  const returnFactor = 0.25 + normalized * 1.75;

  return {
    returnFactor,
    confidence: confidenceFromN(n),
    effectiveN: n,
    source: "mean_sent_fallback",
  };
}

function sampleRoundMood(confidence) {
  const maxAmp = 0.2 * (1 - 0.5 * confidence);
  return (Math.random() * 2 - 1) * maxAmp;
}

export function sampleVolunteerChoice(
  aggregate,
  count = 3,
  confederateMemory = null,
) {
  if (confederateMemory) {
    const { pOne } = decideVolunteer(confederateMemory, aggregate);
    const base = getVolunteerProb(aggregate);
    const mood = sampleRoundMood(base.confidence);
    const pOneRound = clamp(pOne + mood * 0.35, 0.05, 0.95);
    const choices = [];
    for (let i = 0; i < count; i += 1) {
      choices.push(Math.random() < pOneRound ? 1 : 5);
    }
    return {
      choices,
      diagnostics: {
        pOneBase: base.pOne,
        pOneRational: pOne,
        pOneRound,
        mood,
        confidence: base.confidence,
        effectiveN: base.effectiveN,
        source: "confederate_rational",
      },
    };
  }

  const base = getVolunteerProb(aggregate);
  const mood = sampleRoundMood(base.confidence);
  const pOneRound = clamp(base.pOne + mood, 0.05, 0.95);

  const choices = [];
  for (let i = 0; i < count; i += 1) {
    choices.push(Math.random() < pOneRound ? 1 : 5);
  }

  return {
    choices,
    diagnostics: {
      pOneBase: base.pOne,
      pOneRound,
      mood,
      confidence: base.confidence,
      effectiveN: base.effectiveN,
      source: base.source,
    },
  };
}

export function sampleExchangeChoice(aggregate, confederateMemory = null) {
  if (confederateMemory) {
    const { pExchange } = decideExchange(confederateMemory, aggregate);
    return Math.random() < pExchange;
  }
  const base = getExchangeProb(aggregate);
  return Math.random() < base.pHonest;
}

export function sampleTrustReturn(
  sent,
  aggregate,
  confederateMemory = null,
) {
  const amount = Math.max(0, Number(sent) || 0);
  const { returnFactor, confidence } = getTrustBaseline(aggregate);

  const lowFactor =
    toNumber(aggregate?.return_factor_low) ??
    toNumber(aggregate?.mean_return_factor_low);
  const midFactor =
    toNumber(aggregate?.return_factor_mid) ??
    toNumber(aggregate?.mean_return_factor_mid);
  const highFactor =
    toNumber(aggregate?.return_factor_high) ??
    toNumber(aggregate?.mean_return_factor_high);

  let binMultiplier = 1.0;
  let jitterScale = 0.25;

  if (amount <= 3) {
    binMultiplier = lowFactor != null ? clamp(lowFactor, 0.15, 2.5) : 0.9;
    jitterScale = 0.2;
  } else if (amount <= 7) {
    binMultiplier = midFactor != null ? clamp(midFactor, 0.15, 2.5) : 1.0;
    jitterScale = 0.3;
  } else {
    binMultiplier = highFactor != null ? clamp(highFactor, 0.15, 2.5) : 1.1;
    jitterScale = 0.4;
  }

  const uncertaintyBoost = 1 + (1 - confidence) * 0.5;
  let expected = amount * returnFactor * binMultiplier;
  if (confederateMemory) {
    expected *= decideTrust(
      confederateMemory,
      aggregate,
      amount,
    );
  }
  const jitter =
    (Math.random() - 0.5) * amount * jitterScale * uncertaintyBoost;
  const raw = Math.round(expected + jitter);

  return clamp(raw, 0, amount * 3);
}
