import { describe, it, expect } from "vitest";
import {
  normalizeConfederateState,
  updateConfederateState,
  decideExchange,
  decideVolunteer,
  trustReturnModulation,
  aggregateCoopSignal,
} from "../lib/confederate";
import {
  sampleExchangeChoice,
  sampleVolunteerChoice,
  sampleTrustReturn,
} from "../lib/probabilities";

describe("confederate", () => {
  it("normalizes state bounds", () => {
    const s = normalizeConfederateState({
      core: { trust_orientation: 9, greed_orientation: -2 },
      adaptive: { woundedness: 2, reciprocity: -1 },
    });
    expect(s.core.trust_orientation).toBe(1);
    expect(s.core.greed_orientation).toBe(-1);
    expect(s.adaptive.woundedness).toBe(1);
    expect(s.adaptive.reciprocity).toBe(0);
  });

  it("aggregateCoopSignal uses n for confidence", () => {
    const { coop, confidence } = aggregateCoopSignal("volunteer", {
      n: 100,
      pct_one: 70,
      pct_five: 30,
    });
    expect(coop).toBeGreaterThan(0);
    expect(confidence).toBe(0.5);
  });

  it("updateConfederateState shifts core toward cooperative volunteer climate", () => {
    const agg = { n: 80, pct_one: 80, pct_five: 20 };
    let s = normalizeConfederateState(null);
    for (let i = 0; i < 25; i += 1) {
      s = updateConfederateState(s, "volunteer", agg);
    }
    expect(s.core.trust_orientation).toBeGreaterThan(0);
    expect(s.core.greed_orientation).toBeLessThan(0);
  });

  it("decideExchange honors aggregate direction with neutral state", () => {
    const state = normalizeConfederateState(null);
    const pro = decideExchange(state, {
      n: 50,
      pct_exchange: 70,
      pct_keep: 30,
    });
    expect(pro.pExchange).toBeGreaterThan(0.5);
    const anti = decideExchange(state, {
      n: 50,
      pct_exchange: 25,
      pct_keep: 75,
    });
    expect(anti.pExchange).toBeLessThan(0.5);
  });

  it("decideVolunteer respects high reciprocity adaptive state", () => {
    const state = normalizeConfederateState({
      core: { altruism_orientation: 0.5, fairness_orientation: 0.4 },
      adaptive: { reciprocity: 0.95, woundedness: 0.1 },
    });
    const hostileAgg = { n: 60, pct_one: 20, pct_five: 80 };
    const { pOne } = decideVolunteer(state, hostileAgg);
    expect(pOne).toBeGreaterThan(0.05);
  });

  it("trustReturnModulation stays in band", () => {
    const state = normalizeConfederateState(null);
    const m = trustReturnModulation(state, { n: 40, mean_sent: 4 }, 6);
    expect(m).toBeGreaterThanOrEqual(0.72);
    expect(m).toBeLessThanOrEqual(1.28);
  });

  it("sampleExchangeChoice with memory stays boolean", () => {
    const mem = normalizeConfederateState(null);
    const agg = { n: 30, pct_exchange: 55, pct_keep: 45 };
    for (let i = 0; i < 20; i += 1) {
      const v = sampleExchangeChoice(agg, mem);
      expect(typeof v).toBe("boolean");
    }
  });

  it("sampleVolunteerChoice with memory returns three choices", () => {
    const mem = normalizeConfederateState(null);
    const round = sampleVolunteerChoice({ n: 25, pct_one: 50, pct_five: 50 }, 3, mem);
    expect(round.choices).toHaveLength(3);
    for (const c of round.choices) {
      expect([1, 5]).toContain(c);
    }
  });

  it("sampleTrustReturn with memory is within clamp", () => {
    const mem = normalizeConfederateState({
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
