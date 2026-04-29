/**
 * Confederate memory: community aggregate updates core (slow) and adaptive (fast)
 * traits; decision rationals combine both with aggregate-forward utilities.
 *
 * Core `*_orientation` / `*_tolerance` are distinct from player HUD values.
 * Adaptive `reciprocity` here = commitment to uphold norms under stress (fast),
 * vs core `fairness_orientation` (slow baseline).
 */

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function softmax2(a, b, temperature = 1) {
  const t = Math.max(0.25, Number(temperature) || 1);
  const ea = Math.exp(a / t);
  const eb = Math.exp(b / t);
  const z = ea + eb;
  return { pA: ea / z, pB: eb / z };
}

export const NEUTRAL_CORE = Object.freeze({
  trust_orientation: 0,
  altruism_orientation: 0,
  fairness_orientation: 0,
  deceit_tolerance: 0,
  greed_orientation: 0,
});

export const NEUTRAL_ADAPTIVE = Object.freeze({
  woundedness: 0,
  vigilance: 0,
  reciprocity: 0,
  retribution: 0,
  reconciliation: 0,
});

export const NEUTRAL_STATE = Object.freeze({
  core: { ...NEUTRAL_CORE },
  adaptive: { ...NEUTRAL_ADAPTIVE },
});

export function initialConfederate() {
  const blank = () => normalizeState(null);
  return {
    dictator: blank(),
    volunteer: blank(),
    exchange: blank(),
    trust: blank(),
  };
}

function num(x, fallback = null) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeState(state) {
  const s = state ?? NEUTRAL_STATE;
  const c = s.core ?? {};
  const a = s.adaptive ?? {};
  return {
    core: {
      trust_orientation: clamp(num(c.trust_orientation, 0), -1, 1),
      altruism_orientation: clamp(num(c.altruism_orientation, 0), -1, 1),
      fairness_orientation: clamp(num(c.fairness_orientation, 0), -1, 1),
      deceit_tolerance: clamp(num(c.deceit_tolerance, 0), -1, 1),
      greed_orientation: clamp(num(c.greed_orientation, 0), -1, 1),
    },
    adaptive: {
      woundedness: clamp(num(a.woundedness, 0), 0, 1),
      vigilance: clamp(num(a.vigilance, 0), 0, 1),
      reciprocity: clamp(num(a.reciprocity, 0), 0, 1),
      retribution: clamp(num(a.retribution, 0), 0, 1),
      reconciliation: clamp(num(a.reconciliation, 0), 0, 1),
    },
  };
}

function aggN(a) {
  return num(a?.n ?? a?.total ?? a?.count, 0) || 0;
}

function confidenceN(n, maxN = 200) {
  return clamp((Number(n) || 0) / maxN, 0, 1);
}

function volunteerCooperate(aggregate) {
  const one = num(aggregate?.pct_one);
  const five = num(aggregate?.pct_five);
  if (one != null && five != null) return clamp((one - five) / 100, -1, 1);
  return 0;
}

function exchangeCooperate(aggregate) {
  const ex = num(aggregate?.pct_exchange);
  const kp = num(aggregate?.pct_keep);
  if (ex != null && kp != null) return clamp((ex - kp) / 100, -1, 1);
  return 0;
}

function trustCooperate(aggregate) {
  const sent = num(aggregate?.mean_sent ?? aggregate?.avg_sent);
  if (sent != null) return clamp((sent - 5) / 5, -1, 1);
  return 0;
}

function dictatorCooperate(aggregate) {
  const given = num(aggregate?.mean_given ?? aggregate?.avg_given);
  if (given != null) return clamp((given - 5) / 5, -1, 1);
  return 0;
}

/** @param {string} thoughtId */
export function cooperateSignal(thoughtId, aggregate) {
  if (!aggregate || typeof aggregate !== "object") {
    return { coop: 0, confidence: 0 };
  }
  const n = aggN(aggregate);
  const conf = confidenceN(n);
  switch (thoughtId) {
    case "volunteer":
      return { coop: volunteerCooperate(aggregate), confidence: conf };
    case "exchange":
      return { coop: exchangeCooperate(aggregate), confidence: conf };
    case "trust":
      return { coop: trustCooperate(aggregate), confidence: conf };
    case "dictator":
      return { coop: dictatorCooperate(aggregate), confidence: conf };
    default:
      return { coop: 0, confidence: 0 };
  }
}

export function updateCore(prevState, thoughtId, aggregate) {
  const prev = normalizeState(prevState);
  const { coop, confidence } = cooperateSignal(thoughtId, aggregate);
  const k = 0.04 * Math.max(0, confidence);
  const c = prev.core;
  return {
    ...prev,
    core: {
      trust_orientation: clamp(c.trust_orientation + k * coop, -1, 1),
      altruism_orientation: clamp(c.altruism_orientation + k * coop, -1, 1),
      fairness_orientation: clamp(c.fairness_orientation + k * coop, -1, 1),
      deceit_tolerance: clamp(c.deceit_tolerance - k * coop * 0.35, -1, 1),
      greed_orientation: clamp(c.greed_orientation - k * coop, -1, 1),
    },
  };
}

export function updateAdaptive(prevState, thoughtId, aggregate) {
  const prev = normalizeState(prevState);
  const { coop, confidence } = cooperateSignal(thoughtId, aggregate);
  const stress = clamp((1 - coop) * 0.5, 0, 1);
  const heal = clamp((1 + coop) * 0.5, 0, 1);
  const kFast = 0.16 * Math.max(0.35, confidence);
  const decay = 0.04;
  const { adaptive: ad } = prev;

  const woundedness = clamp(
    ad.woundedness * (1 - decay) + kFast * stress,
    0,
    1,
  );
  const vigilance = clamp(
    ad.vigilance * (1 - decay) + kFast * stress,
    0,
    1,
  );
  const reciprocity = clamp(
    ad.reciprocity * (1 - decay) + kFast * heal * 0.65,
    0,
    1,
  );
  const retribution = clamp(
    ad.retribution * (1 - decay) + kFast * stress * 0.85,
    0,
    1,
  );
  const reconciliation = clamp(
    ad.reconciliation * (1 - decay) + kFast * (stress * 0.35 + heal * 0.55),
    0,
    1,
  );

  return {
    ...prev,
    adaptive: {
      woundedness,
      vigilance,
      reciprocity,
      retribution,
      reconciliation,
    },
  };
}

export function updateState(prevState, thoughtId, aggregate) {
  const core = updateCore(prevState, thoughtId, aggregate);
  return updateAdaptive(core, thoughtId, aggregate);
}

export function decideExchange(state, aggregate) {
  const s = normalizeState(state);
  const ex = num(aggregate?.pct_exchange);
  const kp = num(aggregate?.pct_keep);
  const climate =
    ex != null && kp != null ? clamp((ex - kp) / 100, -1, 1) : 0;

  const scoreExchange =
    0.88 * climate +
    0.14 * s.core.trust_orientation +
    0.12 * s.core.fairness_orientation +
    0.1 * s.adaptive.reciprocity +
    0.08 * s.adaptive.reconciliation -
    0.12 * s.adaptive.vigilance -
    0.08 * s.core.greed_orientation -
    0.06 * s.adaptive.retribution;

  const scoreDeceive =
    -0.88 * climate +
    0.12 * s.core.greed_orientation +
    0.14 * s.core.deceit_tolerance +
    0.1 * s.adaptive.woundedness +
    0.1 * s.adaptive.vigilance +
    0.08 * s.adaptive.retribution -
    0.08 * s.core.fairness_orientation;

  const { pA: pExchange } = softmax2(scoreExchange, scoreDeceive, 1);
  const pEx = clamp(pExchange, 0.05, 0.95);
  return { pExchange: pEx, pDeceive: 1 - pEx };
}

export function decideVolunteer(state, aggregate) {
  const s = normalizeState(state);
  const one = num(aggregate?.pct_one);
  const five = num(aggregate?.pct_five);
  const climate =
    one != null && five != null ? clamp((one - five) / 100, -1, 1) : 0;

  const scoreOne =
    0.88 * climate +
    0.16 * s.core.altruism_orientation +
    0.12 * s.core.fairness_orientation +
    0.1 * s.adaptive.reciprocity +
    0.08 * s.adaptive.reconciliation -
    0.08 * s.adaptive.vigilance -
    0.06 * s.adaptive.retribution;

  const scoreFive =
    -0.88 * climate +
    0.14 * s.core.greed_orientation +
    0.1 * s.adaptive.woundedness +
    0.08 * s.adaptive.retribution -
    0.08 * s.core.altruism_orientation;

  const { pA: pOne } = softmax2(scoreOne, scoreFive, 1);
  const p = clamp(pOne, 0.05, 0.95);
  return { pOne: p, pFive: 1 - p };
}

/**
 * Multiplier applied to baseline trust expected return (aggregate-driven).
 * Bounded so aggregate remains dominant.
 */
export function decideTrust(state, aggregate, sentAmount) {
  const s = normalizeState(state);
  const sent = Math.max(0, Number(sentAmount) || 0);
  const climate = trustCooperate(aggregate);

  const stewardLogit =
    1.1 * s.adaptive.reciprocity +
    0.75 * s.core.fairness_orientation +
    0.55 * s.core.trust_orientation +
    0.45 * s.adaptive.reconciliation +
    0.4 * climate -
    0.85 * s.adaptive.woundedness -
    0.35 * s.adaptive.vigilance;

  const pSteward = sigmoid(stewardLogit);
  const cynicTilt =
    0.35 * s.adaptive.retribution +
    0.25 * s.core.greed_orientation +
    0.2 * s.core.deceit_tolerance +
    0.15 * s.adaptive.vigilance -
    0.2 * climate;

  const stewardBoost = 1.05 + 0.22 * pSteward;
  const cynicCut = 1 - 0.18 * (1 - pSteward) * (0.5 + cynicTilt);
  let mod = pSteward * stewardBoost + (1 - pSteward) * cynicCut;
  if (sent >= 7) {
    mod *= 1 + 0.06 * s.adaptive.reciprocity - 0.05 * s.adaptive.retribution;
  }
  return clamp(mod, 0.72, 1.28);
}
