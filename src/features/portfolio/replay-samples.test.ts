import { describe, expect, it } from "vitest";

import { replaySamples } from "./replay-samples";

describe("replaySamples", () => {
  it("contains two samples for each review decision", () => {
    expect(replaySamples).toHaveLength(6);
    expect(replaySamples.filter((item) => item.decision === "confirm")).toHaveLength(2);
    expect(replaySamples.filter((item) => item.decision === "review")).toHaveLength(2);
    expect(replaySamples.filter((item) => item.decision === "manual")).toHaveLength(2);
  });

  it("keeps model output separate from verified values", () => {
    for (const item of replaySamples) {
      expect(item.ai).not.toBe(item.verified);
      expect(item.imageSrc).toMatch(/^\/portfolio\/samples\/sample-0[1-6]\.webp$/);
      expect(item.sourceNote.length).toBeGreaterThan(0);
    }
  });

  it("uses real location mismatches for manual decisions", () => {
    const manualSamples = replaySamples.filter((item) => item.decision === "manual");

    expect(manualSamples).toHaveLength(2);
    expect(manualSamples.every((item) => item.ai.city !== item.verified.city)).toBe(true);
  });
});
