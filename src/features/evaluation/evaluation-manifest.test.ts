import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";

import manifest from "../../../evaluation/manifest.json";
import { validateManifest } from "./validate";

describe("evaluation manifest assets", () => {
  it("keeps the checked-in manifest and all 30 images in sync", () => {
    const samples = validateManifest(manifest);

    expect(samples).toHaveLength(30);
    for (const sample of samples) {
      expect(existsSync(sample.imagePath), sample.imagePath).toBe(true);
    }
  });
});
