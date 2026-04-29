import { describe, expect, it } from "vitest";
import { socialMood } from "../lib/socialMood";

describe("socialMood", () => {
  it("returns null when no aggregate", () => {
    expect(socialMood("dictator", null)).toBe(null);
  });

  it("dictator: cooperative when mean given is high", () => {
    expect(
      socialMood("dictator", { n: 10, mean_given: 6 }),
    ).toBe("cooperative");
  });

  it("volunteer: cautious when pct_five dominates", () => {
    expect(
      socialMood("volunteer", { n: 5, pct_one: 40, pct_five: 60 }),
    ).toBe("cautious");
  });
});
