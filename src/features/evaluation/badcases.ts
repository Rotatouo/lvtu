import type { EvaluationRun } from "./run-records";
import type {
  EvaluationId,
  EvaluationManifest,
  ExpectedLocation,
} from "./types";

export type BadcaseId = `badcase-0${1 | 2 | 3 | 4 | 5}`;

export type BadcaseCategory =
  | "text-prior-conflict"
  | "ocr-geography-drift"
  | "landmark-granularity"
  | "weak-over-inference";

export interface Badcase {
  id: BadcaseId;
  sampleId: EvaluationId;
  baselineRunId: string;
  category: BadcaseCategory;
  expected: ExpectedLocation;
  actual: ExpectedLocation;
  risk: string;
  rootCauseHypothesis: string;
  productStrategy: string;
  retestRunIds: string[];
}

const BADCASE_KEYS: Array<keyof Badcase> = [
  "id",
  "sampleId",
  "baselineRunId",
  "category",
  "expected",
  "actual",
  "risk",
  "rootCauseHypothesis",
  "productStrategy",
  "retestRunIds",
];

const LOCATION_KEYS: Array<keyof ExpectedLocation> = [
  "country",
  "region",
  "city",
  "attraction",
];

const CATEGORIES: readonly BadcaseCategory[] = [
  "text-prior-conflict",
  "ocr-geography-drift",
  "landmark-granularity",
  "weak-over-inference",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actualKeys = Object.keys(value);
  return (
    actualKeys.length === keys.length &&
    keys.every((key) => actualKeys.includes(key))
  );
}

function isLocation(value: unknown): value is ExpectedLocation {
  return (
    isRecord(value) &&
    hasExactKeys(value, LOCATION_KEYS) &&
    LOCATION_KEYS.every(
      (field) => value[field] === null || typeof value[field] === "string",
    )
  );
}

function locationsEqual(left: ExpectedLocation, right: ExpectedLocation) {
  return LOCATION_KEYS.every((field) => left[field] === right[field]);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function invalidBadcases(): never {
  throw new Error("INVALID_BADCASES");
}

export function validateBadcases(
  value: unknown,
  manifest: EvaluationManifest,
  mainRuns: readonly EvaluationRun[],
  retestRuns: readonly EvaluationRun[],
): Badcase[] {
  if (!Array.isArray(value) || value.length < 3 || value.length > 5) {
    invalidBadcases();
  }

  const manifestById = new Map(manifest.map((sample) => [sample.id, sample]));
  const mainRunsById = new Map(mainRuns.map((run) => [run.runId, run]));
  const retestRunsById = new Map(retestRuns.map((run) => [run.runId, run]));
  const badcaseIds = new Set<string>();

  for (const candidate of value) {
    if (!isRecord(candidate) || !hasExactKeys(candidate, BADCASE_KEYS)) {
      invalidBadcases();
    }

    if (
      typeof candidate.id !== "string" ||
      !/^badcase-0[1-5]$/.test(candidate.id) ||
      badcaseIds.has(candidate.id) ||
      typeof candidate.sampleId !== "string" ||
      !isNonEmptyString(candidate.baselineRunId) ||
      !CATEGORIES.includes(candidate.category as BadcaseCategory) ||
      !isLocation(candidate.expected) ||
      !isLocation(candidate.actual) ||
      !isNonEmptyString(candidate.risk) ||
      !isNonEmptyString(candidate.rootCauseHypothesis) ||
      !candidate.rootCauseHypothesis.startsWith("假设：") ||
      candidate.rootCauseHypothesis.slice("假设：".length).trim().length === 0 ||
      !isNonEmptyString(candidate.productStrategy) ||
      !Array.isArray(candidate.retestRunIds) ||
      candidate.retestRunIds.length === 0 ||
      !candidate.retestRunIds.every(isNonEmptyString)
    ) {
      invalidBadcases();
    }

    const badcase = candidate as unknown as Badcase;
    const sample = manifestById.get(badcase.sampleId);
    const baselineRun = mainRunsById.get(badcase.baselineRunId);
    if (
      !sample ||
      !baselineRun ||
      baselineRun.mode !== "main" ||
      baselineRun.sampleId !== badcase.sampleId ||
      !locationsEqual(badcase.expected, sample.expected) ||
      !locationsEqual(badcase.actual, baselineRun.output)
    ) {
      invalidBadcases();
    }

    const uniqueRetestRunIds = new Set(badcase.retestRunIds);
    if (uniqueRetestRunIds.size !== badcase.retestRunIds.length) {
      invalidBadcases();
    }

    for (const runId of badcase.retestRunIds) {
      const retestRun = retestRunsById.get(runId);
      if (
        !retestRun ||
        retestRun.mode !== "retest" ||
        retestRun.sampleId !== badcase.sampleId
      ) {
        invalidBadcases();
      }
    }

    badcaseIds.add(badcase.id);
  }

  return value as Badcase[];
}
