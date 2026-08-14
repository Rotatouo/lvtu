import { describe, expect, it } from "vitest";

import type {
  ClueTier,
  EvaluationManifest,
  EvaluationSample,
} from "./types";
import { validateManifest } from "./validate";

const TIERS: ClueTier[] = ["text", "landmark", "weak"];

function makeSample(index: number, clueTier: ClueTier): EvaluationSample {
  return {
    id: `eval-${String(index).padStart(2, "0")}`,
    imagePath: `evaluation/images/eval-${String(index).padStart(2, "0")}.webp`,
    clueTier,
    sourceNote: "用户自有并已脱敏的旅行截图",
    expected: {
      country: "中国",
      region: "广西壮族自治区",
      city: "桂林市",
      attraction: "漓江风景名胜区",
    },
    expectedDecision: "confirm",
    verificationNote: "依据用户原始行程记录核验",
  };
}

function makeManifest(): EvaluationManifest {
  return Array.from({ length: 30 }, (_, offset) => {
    const index = offset + 1;
    const clueTier = TIERS[Math.floor(offset / 10)];
    return makeSample(index, clueTier);
  });
}

describe("validateManifest", () => {
  it("accepts exactly 30 samples with the required IDs and tier quotas", () => {
    expect(validateManifest(makeManifest())).toHaveLength(30);
  });

  it.each([29, 31])("rejects a manifest containing %i samples", (size) => {
    const manifest =
      size < 30
        ? makeManifest().slice(0, size)
        : [...makeManifest(), makeSample(31, "weak")];

    expect(() => validateManifest(manifest)).toThrow(
      "MANIFEST_REQUIRES_30_SAMPLES",
    );
  });

  it("requires the complete eval-01 through eval-30 ID set", () => {
    const manifest = makeManifest();
    manifest[29] = { ...manifest[29], id: "eval-31" };

    expect(() => validateManifest(manifest)).toThrow("INVALID_SAMPLE_IDS");
  });

  it("requires exactly ten samples per clue tier", () => {
    const manifest = makeManifest();
    manifest[9] = { ...manifest[9], clueTier: "landmark" };

    expect(() => validateManifest(manifest)).toThrow(
      "MANIFEST_REQUIRES_10_SAMPLES_PER_CLUE_TIER",
    );
  });

  it("requires each image path to match its sample ID without a leading slash", () => {
    const manifest = makeManifest();
    manifest[0] = {
      ...manifest[0],
      imagePath: "/evaluation/images/eval-01.webp",
    };

    expect(() => validateManifest(manifest)).toThrow("INVALID_IMAGE_PATH");
  });

  it("rejects a sample missing a required top-level field", () => {
    const manifest = makeManifest() as unknown as Array<Record<string, unknown>>;
    Reflect.deleteProperty(manifest[0], "verificationNote");

    expect(() => validateManifest(manifest)).toThrow("INVALID_SAMPLE_SCHEMA");
  });

  it("rejects a sample with an extra top-level field", () => {
    const manifest = makeManifest() as unknown as Array<Record<string, unknown>>;
    manifest[0] = { ...manifest[0], debugNote: "not part of the schema" };

    expect(() => validateManifest(manifest)).toThrow("INVALID_SAMPLE_SCHEMA");
  });

  it("requires a non-empty source note for every sample", () => {
    const manifest = makeManifest();
    manifest[0] = { ...manifest[0], sourceNote: "  " };

    expect(() => validateManifest(manifest)).toThrow("SOURCE_NOTE_REQUIRED");
  });

  it("requires a verification note for every sample", () => {
    const manifest = makeManifest();
    manifest[0] = { ...manifest[0], verificationNote: "" };

    expect(() => validateManifest(manifest)).toThrow(
      "VERIFICATION_NOTE_REQUIRED",
    );
  });

  it.each([
    { expected: null, label: "a missing expected object" },
    {
      expected: { country: "中国", region: null, city: "桂林市" },
      label: "a missing expected field",
    },
    {
      expected: {
        country: "中国",
        region: null,
        city: "桂林市",
        attraction: null,
        coordinates: [25.2, 110.4],
      },
      label: "an extra expected field",
    },
    {
      expected: {
        country: "中国",
        region: null,
        city: "  ",
        attraction: null,
      },
      label: "an empty expected field",
    },
  ])("rejects $label", ({ expected }) => {
    const manifest = makeManifest() as unknown as Array<Record<string, unknown>>;
    manifest[0] = { ...manifest[0], expected };

    expect(() => validateManifest(manifest)).toThrow(
      "INVALID_EXPECTED_LOCATION",
    );
  });

  it("only accepts confirm, review, or manual as expectedDecision", () => {
    const manifest = makeManifest() as unknown as Array<Record<string, unknown>>;
    manifest[0] = { ...manifest[0], expectedDecision: "approve" };

    expect(() => validateManifest(manifest)).toThrow(
      "INVALID_EXPECTED_DECISION",
    );
  });
});
