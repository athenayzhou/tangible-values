/**
 * Confederate memory (Model B + Pattern B)
 *
 * **Climate** (community aggregate) only updates core/adaptive via `cooperateSignal` /
 * `updateState`. It must not enter moment-of-action softmax.
 *
 * **Weather** = confederate core + adaptive felt inside a portaled thought (this state).
 * **Atmosphere** (standing, base scene) is separate — see `Atmosphere.jsx` / HUD.
 *
 * **Mutual benefit** vs **private advantage**: six sub-pulls (norm, bond, give, fear,
 * grudge, gain) combine into two totals, cross-suppressed, then softmax → `pMutualBenefit`.
 *
 * Core `*_orientation` / `*_tolerance` are distinct from player HUD values.
 * Adaptive traits are stored in [0, 1]; use `adaptiveCentered` only in decision scoring.
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

/** Adaptive stored in [0,1]; center to [-1,1] for scoring alongside core. */
export function adaptiveCentered(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return clamp((n - 0.5) * 2, -1, 1);
}

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

// --- Model B decision: mutual benefit vs private advantage (trait-only) ---

const K_CROSS_EXCHANGE = 0.35;
const K_CROSS_VOLUNTEER = 0.35;
const TEMP_EXCHANGE = 1;
const TEMP_VOLUNTEER = 1;

/**
 * @param {ReturnType<typeof normalizeState>} s
 * @param {'exchange' | 'volunteer'} spec
 */
function sixSubPulls(s, spec) {
  const c = s.core;
  const a = s.adaptive;
  const ac = adaptiveCentered;

  if (spec === "exchange") {
    const normPull =
      0.14 * c.trust_orientation + 0.12 * c.fairness_orientation;
    const bondPull =
      0.1 * ac(a.reciprocity) + 0.08 * ac(a.reconciliation);
    const givePull = 0.08 * c.altruism_orientation;
    /* Defect: betrayal sensitivity — vigilance / woundedness / retribution lead;
     * greed + deceit secondary vs fear+grudge. */
    const fearPull =
      0.12 * ac(a.vigilance) + 0.12 * ac(a.woundedness);
    const grudgePull = 0.11 * ac(a.retribution);
    const gainPull =
      0.08 * c.greed_orientation + 0.09 * c.deceit_tolerance;
    return {
      normPull,
      bondPull,
      givePull,
      fearPull,
      grudgePull,
      gainPull,
    };
  }

  const normPull =
    0.1 * c.trust_orientation + 0.12 * c.fairness_orientation;
  const bondPull =
    0.1 * ac(a.reciprocity) + 0.08 * ac(a.reconciliation);
  const givePull = 0.16 * c.altruism_orientation;
  const fearPull =
    0.08 * ac(a.vigilance) + 0.1 * ac(a.woundedness);
  const grudgePull = 0.08 * ac(a.retribution);
  const gainPull = 0.14 * c.greed_orientation;

  return {
    normPull,
    bondPull,
    givePull,
    fearPull,
    grudgePull,
    gainPull,
  };
}

function mutualPrivateProb(s, kCross, temperature, spec) {
  const pulls = sixSubPulls(s, spec);
  const mutualBenefitTotal =
    pulls.normPull + pulls.bondPull + pulls.givePull;
  const privateAdvantageTotal =
    pulls.fearPull + pulls.grudgePull + pulls.gainPull;
  const scoreMutualBenefit =
    mutualBenefitTotal - kCross * privateAdvantageTotal;
  const scorePrivateAdvantage =
    privateAdvantageTotal - kCross * mutualBenefitTotal;
  const { pA: pMutualBenefitRaw } = softmax2(
    scoreMutualBenefit,
    scorePrivateAdvantage,
    temperature,
  );
  const pMutualBenefit = clamp(pMutualBenefitRaw, 0.05, 0.95);
  return {
    pMutualBenefit,
    pPrivateAdvantage: 1 - pMutualBenefit,
    pulls,
    mutualBenefitTotal,
    privateAdvantageTotal,
    scoreMutualBenefit,
    scorePrivateAdvantage,
  };
}

/**
 * Exchange: mutual benefit ↔ exchange; private advantage ↔ deceive.
 * Aggregate is ignored (Model B).
 */
export function decideExchange(state) {
  const s = normalizeState(state);
  const {
    pMutualBenefit,
    pPrivateAdvantage,
  } = mutualPrivateProb(s, K_CROSS_EXCHANGE, TEMP_EXCHANGE, "exchange");
  return {
    pExchange: pMutualBenefit,
    pDeceive: pPrivateAdvantage,
    pMutualBenefit,
    pPrivateAdvantage,
  };
}

/**
 * Volunteer: mutual benefit ↔ choose 1; private advantage ↔ choose 5.
 * Aggregate is ignored (Model B).
 */
export function decideVolunteer(state) {
  const s = normalizeState(state);
  const {
    pMutualBenefit,
    pPrivateAdvantage,
  } = mutualPrivateProb(s, K_CROSS_VOLUNTEER, TEMP_VOLUNTEER, "volunteer");
  return {
    pOne: pMutualBenefit,
    pFive: pPrivateAdvantage,
    pMutualBenefit,
    pPrivateAdvantage,
  };
}

/**
 * Return multiplier from confederate traits only (no climate / aggregate).
 * Bounded ~ [0.72, 1.28].
 */
export function decideTrust(state, sentAmount) {
  const s = normalizeState(state);
  const sent = Math.max(0, Number(sentAmount) || 0);
  const a = s.adaptive;
  const c = s.core;
  const ac = adaptiveCentered;

  const stewardLogit =
    1.15 * ac(a.reciprocity) +
    0.75 * c.fairness_orientation +
    0.55 * c.trust_orientation +
    0.45 * ac(a.reconciliation) -
    0.85 * ac(a.woundedness) -
    0.35 * ac(a.vigilance);

  const pSteward = sigmoid(stewardLogit);
  /* Withholding: vigilance, woundedness, greed, deceit; retribution lighter (no multi-round sting). */
  const cynicTilt =
    0.14 * ac(a.retribution) +
    0.26 * ac(a.vigilance) +
    0.18 * ac(a.woundedness) +
    0.22 * c.greed_orientation +
    0.2 * c.deceit_tolerance;

  const stewardBoost = 1.05 + 0.22 * pSteward;
  const cynicCut = 1 - 0.18 * (1 - pSteward) * (0.5 + cynicTilt);
  let mod = pSteward * stewardBoost + (1 - pSteward) * cynicCut;
  if (sent >= 7) {
    mod *= 1 + 0.06 * a.reciprocity - 0.05 * a.retribution;
  }
  return clamp(mod, 0.72, 1.28);
}
