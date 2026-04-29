import { describe, expect, it, beforeEach } from "vitest";
import {
  buildRecapPayload,
  pickStanding,
  persistPendingInstanceRecap,
  takePendingInstanceRecap,
  clearPendingInstanceRecapIfMatch,
  PENDING_INSTANCE_RECAP_KEY,
} from "../lib/settleRecap";

describe("pickStanding", () => {
  it("reads standing from known keys", () => {
    expect(pickStanding({ standing: 12.3 })).toBe(12.3);
    expect(pickStanding({ standing_score: 7 })).toBe(7);
  });
});

describe("buildRecapPayload", () => {
  it("prefers settle row stake and payout", () => {
    const p = buildRecapPayload({
      thoughtId: "exchange",
      standingBefore: 1,
      settleRow: {
        stake: 3,
        payout: 5,
        net: 2,
        outcome_label: "exchange_honest_honest",
        value_deltas: { trust: 2, altruism: 1, deceit: 0, greed: 0 },
        standing: 4,
      },
      nextValues: null,
      settleOk: true,
    });
    expect(p.stake).toBe(3);
    expect(p.payout).toBe(5);
    expect(p.net).toBe(2);
    expect(p.valueDeltas.trust).toBe(2);
    expect(p.saveStatus).toBe("saved");
  });
});

describe("pending instance recap", () => {
  beforeEach(() => {
    try {
      window.sessionStorage.removeItem(PENDING_INSTANCE_RECAP_KEY);
    } catch {
      /* ignore */
    }
  });

  it("takePendingInstanceRecap returns recap and clears key when session matches", () => {
    const sid = "11111111-1111-1111-1111-111111111111";
    const recap = { thoughtId: "trust", stake: 10, net: 0 };
    persistPendingInstanceRecap(sid, "trust", recap);
    expect(takePendingInstanceRecap(sid)).toEqual(recap);
    expect(window.sessionStorage.getItem(PENDING_INSTANCE_RECAP_KEY)).toBeNull();
  });

  it("takePendingInstanceRecap returns null when session mismatches", () => {
    persistPendingInstanceRecap(
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "exchange",
      { thoughtId: "exchange" },
    );
    expect(
      takePendingInstanceRecap("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
    ).toBeNull();
    expect(window.sessionStorage.getItem(PENDING_INSTANCE_RECAP_KEY)).not.toBeNull();
  });

  it("clearPendingInstanceRecapIfMatch removes only matching session+thought", () => {
    const sid = "22222222-2222-2222-2222-222222222222";
    persistPendingInstanceRecap(sid, "trust", { thoughtId: "trust" });
    clearPendingInstanceRecapIfMatch(sid, "trust");
    expect(window.sessionStorage.getItem(PENDING_INSTANCE_RECAP_KEY)).toBeNull();
  });
});
