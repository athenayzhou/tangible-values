import { describe, it, expect } from "vitest";
import { assetUrl } from "./assetUrl.js";

describe("assetUrl", () => {
  it("prefixes BASE_URL and strips leading slashes", () => {
    expect(assetUrl("models/coin.glb")).toBe(
      `${import.meta.env.BASE_URL}models/coin.glb`,
    );
    expect(assetUrl("/matcaps/a.png")).toBe(
      `${import.meta.env.BASE_URL}matcaps/a.png`,
    );
  });
});
