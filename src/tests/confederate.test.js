import { describe, it, expect } from "vitest";
import {
  normalizeState,
  updateState,
  decideExchange,
  decideVolunteer,
  decideTrust,
  cooperateSignal,
  adaptiveCentered,
} from "../lib/confederate";
import {
  sampleExchangeChoice,
  sampleVolunteerChoice,
  sampleTrustReturn,
} from "../lib/probabilities";

describe("confederate", () => {
  it("normalizes state bounds", () => {
    const s = normalizeState({
      core: { trust_orientation: 9, greed_orientation: -2 },
      adaptive: { woundedness: 2, reciprocity: -1 },
    });
    expect(s.core.trust_orientation).toBe(1);
    expect(s.core.greed_orientation).toBe(-1);
    expect(s.adaptive.woundedness).toBe(1);
    expect(s.adaptive.reciprocity).toBe(0);
  });

  it("cooperateSignal uses n for confidence", () => {
    const { coop, confidence } = cooperateSignal("volunteer", {
      n: 100,
      pct_one: 70,
      pct_five: 30,
    });
    expect(coop).toBeGreaterThan(0);
    expect(confidence).toBe(0.5);
  });

  it("updateState shifts core toward cooperative volunteer climate", () => {
    const agg = { n: 80, pct_one: 80, pct_five: 20 };
    let s = normalizeState(null);
    for (let i = 0; i < 25; i += 1) {
      s = updateState(s, "volunteer", agg);
    }
    expect(s.core.trust_orientation).toBeGreaterThan(0);
    expect(s.core.greed_orientation).toBeLessThan(0);
  });

  it("decideExchange ignores aggregate at decision time (Model B)", () => {
    const state = normalizeState(null);
    const a = decideExchange(state, {
      n: 50,
      pct_exchange: 70,
      pct_keep: 30,
    });
    const b = decideExchange(state, {
      n: 50,
      pct_exchange: 25,
      pct_keep: 75,
    });
    const c = decideExchange(state);
    expect(a.pExchange).toBe(b.pExchange);
    expect(b.pExchange).toBe(c.pExchange);
    expect(a.pMutualBenefit).toBe(a.pExchange);
  });

  it("decideExchange varies with confederate state", () => {
    const highMutual = normalizeState({
      adaptive: { reciprocity: 0.95, reconciliation: 0.9 },
      core: { trust_orientation: 0.6, fairness_orientation: 0.5 },
    });
    const highPrivate = normalizeState({
      adaptive: { vigilance: 0.95, woundedness: 0.9, retribution: 0.8 },
      core: { greed_orientation: 0.8, deceit_tolerance: 0.6 },
    });
    const pm = decideExchange(highMutual).pExchange;
    const pp = decideExchange(highPrivate).pExchange;
    expect(pm).toBeGreaterThan(pp);
  });

  it("decideVolunteer respects high reciprocity (trait-only)", () => {
    const state = normalizeState({
      core: { altruism_orientation: 0.5, fairness_orientation: 0.4 },
      adaptive: { reciprocity: 0.95, woundedness: 0.1 },
    });
    const { pOne } = decideVolunteer(state);
    expect(pOne).toBeGreaterThan(0.5);
  });

  it("decideVolunteer ignores aggregate at decision time", () => {
    const state = normalizeState({
      core: { altruism_orientation: 0.2 },
      adaptive: { reciprocity: 0.5 },
    });
    const hostileAgg = { n: 60, pct_one: 20, pct_five: 80 };
    const mildAgg = { n: 60, pct_one: 55, pct_five: 45 };
    expect(decideVolunteer(state, hostileAgg).pOne).toBe(
      decideVolunteer(state, mildAgg).pOne,
    );
  });

  it("decideTrust stays in band and ignores aggregate", () => {
    const state = normalizeState(null);
    expect(decideTrust(state, 6)).toBeGreaterThanOrEqual(0.72);
    expect(decideTrust(state, 6)).toBeLessThanOrEqual(1.28);
    const warm = normalizeState({
      adaptive: { reciprocity: 0.95, woundedness: 0.05, reconciliation: 0.8 },
      core: { fairness_orientation: 0.6, trust_orientation: 0.5 },
    });
    const mA = decideTrust(warm, 5, { n: 40, mean_sent: 2 });
    const mB = decideTrust(warm, 5, { n: 40, mean_sent: 9 });
    expect(mA).toBe(mB);
  });

  it("adaptiveCentered maps 0.5 to 0 and endpoints to ±1", () => {
    expect(adaptiveCentered(0.5)).toBe(0);
    expect(adaptiveCentered(0)).toBe(-1);
    expect(adaptiveCentered(1)).toBe(1);
  });

  it("sampleExchangeChoice with memory stays boolean", () => {
    const mem = normalizeState(null);
    const agg = { n: 30, pct_exchange: 55, pct_keep: 45 };
    for (let i = 0; i < 20; i += 1) {
      const v = sampleExchangeChoice(agg, mem);
      expect(typeof v).toBe("boolean");
    }
  });

  it("sampleVolunteerChoice with memory returns three choices", () => {
    const mem = normalizeState(null);
    const round = sampleVolunteerChoice(
      { n: 25, pct_one: 50, pct_five: 50 },
      3,
      mem,
    );
    expect(round.choices).toHaveLength(3);
    for (const c of round.choices) {
      expect([1, 5]).toContain(c);
    }
  });

  it("sampleTrustReturn with memory is within clamp", () => {
    const mem = normalizeState({
      adaptive: { reciprocity: 0.9, woundedness: 0.1 },
    });
    const sent = 5;
    const agg = { n: 30, mean_sent: 5 };
    for (let i = 0; i < 15; i += 1) {
      const r = sampleTrustReturn(sent, agg, mem);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(sent * 3);
    }
  });
});
