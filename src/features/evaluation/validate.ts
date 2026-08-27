import type {
  ClueTier,
  EvaluationManifest,
  EvaluationSample,
  ExpectedDecision,
  ExpectedLocation,
} from "./types";

const REQUIRED_SAMPLE_IDS = Array.from(
  { length: 30 },
  (_, index) => `eval-${String(index + 1).padStart(2, "0")}`,
);
const CLUE_TIERS: ClueTier[] = ["text", "landmark", "weak"];
const EXPECTED_DECISIONS: ExpectedDecision[] = ["confirm", "review", "manual"];
const EXPECTED_LOCATION_KEYS: Array<keyof ExpectedLocation> = [
  "country",
  "region",
  "city",
  "attraction",
];
const REQUIRED_SAMPLE_KEYS: Array<keyof EvaluationSample> = [
  "id",
  "imagePath",
  "clueTier",
  "sourceNote",
  "expected",
  "expectedDecision",
  "verificationNote",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasRequiredNote(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasExactSampleSchema(sample: Record<string, unknown>) {
  const keys = Object.keys(sample);
  return (
    keys.length === REQUIRED_SAMPLE_KEYS.length &&
    REQUIRED_SAMPLE_KEYS.every((key) => keys.includes(key))
  );
}

function isExpectedLocation(value: unknown): value is ExpectedLocation {
  if (!isRecord(value)) return false;

  const keys = Object.keys(value);
  if (
    keys.length !== EXPECTED_LOCATION_KEYS.length ||
    !EXPECTED_LOCATION_KEYS.every((key) => keys.includes(key))
  ) {
    return false;
  }

  return EXPECTED_LOCATION_KEYS.every((key) => {
    const field = value[key];
    return field === null || hasRequiredNote(field);
  });
}

export function validateManifest(manifest: unknown): EvaluationManifest {
  if (!Array.isArray(manifest) || manifest.length !== 30) {
    throw new Error("MANIFEST_REQUIRES_30_SAMPLES");
  }

  const samples = manifest.filter(isRecord);
  if (samples.length !== 30 || !samples.every(hasExactSampleSchema)) {
    throw new Error("INVALID_SAMPLE_SCHEMA");
  }

  const ids = new Set(samples.map((sample) => sample.id));
  if (
    ids.size !== 30 ||
    !REQUIRED_SAMPLE_IDS.every((id) => ids.has(id))
  ) {
    throw new Error("INVALID_SAMPLE_IDS");
  }

  if (
    !CLUE_TIERS.every(
      (tier) => samples.filter((sample) => sample.clueTier === tier).length === 10,
    )
  ) {
    throw new Error("MANIFEST_REQUIRES_10_SAMPLES_PER_CLUE_TIER");
  }

  for (const sample of samples) {
    if (sample.imagePath !== `evaluation/images/${sample.id}.webp`) {
      throw new Error("INVALID_IMAGE_PATH");
    }
    if (!hasRequiredNote(sample.sourceNote)) {
      throw new Error("SOURCE_NOTE_REQUIRED");
    }
    if (!hasRequiredNote(sample.verificationNote)) {
      throw new Error("VERIFICATION_NOTE_REQUIRED");
    }
    if (!isExpectedLocation(sample.expected)) {
      throw new Error("INVALID_EXPECTED_LOCATION");
    }
    if (!EXPECTED_DECISIONS.includes(sample.expectedDecision as ExpectedDecision)) {
      throw new Error("INVALID_EXPECTED_DECISION");
    }
  }

  return manifest as EvaluationSample[];
}
