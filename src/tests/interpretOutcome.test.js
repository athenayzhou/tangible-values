import { describe, expect, it } from "vitest";
import {
  interpretGold,
  interpretOutcome,
} from "../lib/interpretOutcome";

describe("interpretGold", () => {
  it("mentions portal stake for trust", () => {
    const line = interpretGold("trust");
    expect(line).toMatch(/10 gold/);
    expect(line).toMatch(/portal/i);
  });
});

describe("interpretOutcome", () => {
  it("maps known trust label", () => {
    const s = interpretOutcome("trust", "trust_high_high");
    expect(s.length).toBeGreaterThan(10);
  });
});
