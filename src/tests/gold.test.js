import { describe, expect, it } from "vitest";
import { isInsufficientStake, stakeForThought } from "../lib/gold";

describe("stakeForThought", () => {
  it("matches canonical table", () => {
    expect(stakeForThought("dictator")).toBe(0);
    expect(stakeForThought("volunteer")).toBe(0);
    expect(stakeForThought("exchange")).toBe(3);
    expect(stakeForThought("trust")).toBe(10);
    expect(stakeForThought("unknown")).toBe(0);
  });
});

describe("isInsufficientStake", () => {
  it("detects insufficient stake errors", () => {
    expect(
      isInsufficientStake(
        new Error("insufficient gold for stake (have 1, need 3)"),
      ),
    ).toBe(true);
    expect(isInsufficientStake("insufficient gold for STAKE")).toBe(true);
    expect(isInsufficientStake(new Error("network"))).toBe(false);
  });
});
