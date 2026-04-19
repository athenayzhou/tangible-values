export const BASE_MIN = -100;
export const BASE_MAX = 100;
export const STANDING_MIN = -200;
export const STANDING_MAX = 200;
export const DEFAULT_EMA_ALPHA = 0.35;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function ema(prev, nextRaw, alpha = DEFAULT_EMA_ALPHA) {
  return alpha * nextRaw + (1 - alpha) * prev;
}

export function computeStanding({ trust, altruism, deceit, greed }) {
  return clamp(trust + altruism - deceit - greed, STANDING_MIN, STANDING_MAX);
}
