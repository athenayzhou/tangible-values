function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function ratioFromCounts(a, b) {
  const nA = toNumber(a);
  const nB = toNumber(b);
  if(nA == null || nB == null) return null;
  const t = nA + nB;
  if(t <= 0) return null;
  return { ratio: nA / t, n: t };
}

function pctToRatio(pct) {
  const p = toNumber(pct);
  if(p == null) return null;
  return clamp(p/100, 0, 1);
}

export function getVolunteerProb(aggregate){
  let pOne = pctToRatio(aggregate?.pct_one);
  if(pOne == null) {
    pOne = ratioFromCounts(aggregate?.count_one ?? aggregate?.cnt_one, aggregate?.count_five ?? aggregate?.cnt_five);
  }
  if (pOne == null) {
    const majorityChoice = String(aggregate?.majority_choice ?? aggregate?.majority ?? "").trim();
    const majorityPct = pctToRatio(aggregate?.majority_pct ?? aggregate?.majority_percent);
    if(majorityPct != null && (majorityChoice === "1" || majorityChoice === "5")){
      pOne = majorityChoice === "1" ? majorityPct : 1 - majorityPct;
    }
  }

  if (pOne == null) pOne = 0.5;

  pOne = clamp(pOne, 0.05, 0.95);

  return {
    pOne,
    pFive: 1 - pOne,
  };
}

export function getExchangeProb(aggregate){
  let pHonest = pctToRatio(aggregate?.pct_exchange);

  if(pHonest == null){
    pHonest = ratioFromCounts(
      aggregate?.count_exchange ?? aggregate?.cnt_exchange,
      aggregate?.count_keep ?? aggregate?.cnt_keep,
    );
  }

  if(pHonest == null){
    const majorityChoice = String(aggregate?.majority_choice ?? "").trim().toLowerCase();
    const majorityPct = pctToRatio(aggregate?.majority_pct ?? aggregate?.majority_percent);
    if(majorityPct != null && (majorityChoice === "exchange" || majorityChoice === "keep")){
      pHonest = majorityChoice === "exchange" ? majorityPct : 1 - majorityPct;
    }
  }

  if (pHonest == null) pHonest = 0.5;
  pHonest = clamp(pHonest, 0.05, 0.95);

  return {
    pHonest,
    pDeceive: 1 - pHonest,
  }
}

export function getTrustBaseline(aggregate){
  const avgSent =
    toNumber(aggregate?.mean_sent) ??
    toNumber(aggregate?.avg_sent) ??
    toNumber(aggregate?.average_sent) ??
    toNumber(aggregate?.avg_amount_sent) ??
    toNumber(aggregate?.mean_amount_sent) ??
    toNumber(aggregate?.avg_of_sent);

  if(avgSent == null){
    return { returnFactor: 1.0 };
  }

  const normalized = clamp(avgSent / 10, 0, 1);
  const returnFactor = 0.25 + normalized * 1.75;
  return { returnFactor };
}

export function sampleVolunteerChoice(aggregate){
  const { pOne } = getVolunteerProb(aggregate);
  return Math.random() < pOne ? 1 : 5;
}

export function sampleExchangeChoice(aggregate){
  const { pHonest } = getExchangeProb(aggregate);
  return Math.random() < pHonest;
}

export function sampleTrustReturn(sent, aggregate){
  const amount = Math.max(0, Number(sent) || 0);
  const { returnFactor } = getTrustBaseline(aggregate);

  const expected = amount * returnFactor;
  const jitter = (Math.random() - 0.5) * amount * 0.6;
  const raw = Math.round(expected + jitter);

  return clamp(raw, 0, amount * 3);
}

// export function getDictatorBaseline(aggregate){
//   const avgGiven = 
//     toNumber(aggregate?.mean_given) ??
//     toNumber(aggregate?.avg_given) ??
//     toNumber(aggregate?.meanGiven) ??

//   const avgKept =

// }