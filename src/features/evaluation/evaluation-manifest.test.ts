import { existsSync, readFileSync } from "node:fs";

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

  it("keeps every WebP image paired with exactly one attribution row", () => {
    const samples = validateManifest(manifest);
    const sources = readFileSync("evaluation/SOURCES.md", "utf8");

    for (const sample of samples) {
      const bytes = readFileSync(sample.imagePath);
      const filename = `${sample.id}.webp`;

      expect(bytes.subarray(0, 4).toString("ascii"), filename).toBe("RIFF");
      expect(bytes.subarray(8, 12).toString("ascii"), filename).toBe("WEBP");
      expect(sources.match(new RegExp(filename, "g")), filename).toHaveLength(1);
    }
  });
});
