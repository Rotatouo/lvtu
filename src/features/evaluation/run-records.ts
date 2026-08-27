import type {
  InferenceResult,
  ReviewDecision,
} from "@/features/portfolio/types";

import type { EvaluationId, EvaluationSample } from "./types";

export type EvaluationMode = "main" | "repeat" | "retest";

export interface EvaluationRun {
  runId: string;
  sampleId: EvaluationId;
  mode: EvaluationMode;
  attempt: number;
  model: string;
  startedAt: string;
  durationMs: number;
  output: InferenceResult;
  decision: ReviewDecision;
}

export interface EvaluationJob {
  runId: string;
  sampleId: EvaluationId;
  imagePath: string;
  mode: EvaluationMode;
  attempt: number;
}

const RUN_KEYS: Array<keyof EvaluationRun> = [
  "runId",
  "sampleId",
  "mode",
  "attempt",
  "model",
  "startedAt",
  "durationMs",
  "output",
  "decision",
];
const OUTPUT_KEYS: Array<keyof InferenceResult> = [
  "country",
  "region",
  "city",
  "attraction",
  "confidence",
  "evidence",
  "lat",
  "lng",
  "openingNote",
];
const EVALUATION_MODES: EvaluationMode[] = ["main", "repeat", "retest"];
const REVIEW_DECISIONS: ReviewDecision[] = ["confirm", "review", "manual"];
const CONFIDENCES: InferenceResult["confidence"][] = [
  "high",
  "medium",
  "low",
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

function isEvaluationId(value: unknown): value is EvaluationId {
  return (
    typeof value === "string" && /^eval-(?:0[1-9]|[12]\d|30)$/.test(value)
  );
}

function isNullableNonEmptyString(value: unknown) {
  return value === null || (typeof value === "string" && value.trim().length > 0);
}

function isNullableCoordinate(value: unknown, minimum: number, maximum: number) {
  return (
    value === null ||
    (typeof value === "number" &&
      Number.isFinite(value) &&
      value >= minimum &&
      value <= maximum)
  );
}

function isInferenceResult(value: unknown): value is InferenceResult {
  if (!isRecord(value) || !hasExactKeys(value, OUTPUT_KEYS)) return false;

  return (
    [value.country, value.region, value.city, value.attraction].every(
      isNullableNonEmptyString,
    ) &&
    CONFIDENCES.includes(value.confidence as InferenceResult["confidence"]) &&
    typeof value.evidence === "string" &&
    value.evidence.trim().length > 0 &&
    isNullableCoordinate(value.lat, -90, 90) &&
    isNullableCoordinate(value.lng, -180, 180) &&
    (value.openingNote === null || typeof value.openingNote === "string")
  );
}

function isIsoTimestamp(value: unknown) {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function hasLocationValue(value: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function buildJob(
  sample: EvaluationSample,
  mode: EvaluationMode,
  attempt: number,
): EvaluationJob {
  return {
    runId: `${mode}:${sample.id}:${attempt}`,
    sampleId: sample.id,
    imagePath: sample.imagePath,
    mode,
    attempt,
  };
}

export function deriveDecision(output: InferenceResult): ReviewDecision {
  if (output.confidence === "low" || !hasLocationValue(output.country)) {
    return "manual";
  }

  const hasAllLocationFields = [
    output.country,
    output.region,
    output.city,
    output.attraction,
  ].every(hasLocationValue);

  return output.confidence === "high" && hasAllLocationFields
    ? "confirm"
    : "review";
}

export function validateEvaluationRuns(
  value: unknown,
  expectedMode?: EvaluationMode,
): EvaluationRun[] {
  if (!Array.isArray(value)) throw new Error("INVALID_EVALUATION_RUNS");

  const runIds = new Set<string>();
  for (const candidate of value) {
    if (!isRecord(candidate) || !hasExactKeys(candidate, RUN_KEYS)) {
      throw new Error("INVALID_EVALUATION_RUNS");
    }

    const mode = candidate.mode as EvaluationMode;
    const decision = candidate.decision as ReviewDecision;
    const attempt = candidate.attempt;
    const output = candidate.output;
    if (
      !isEvaluationId(candidate.sampleId) ||
      !EVALUATION_MODES.includes(mode) ||
      typeof attempt !== "number" ||
      !Number.isInteger(attempt) ||
      attempt < 1 ||
      candidate.runId !== `${mode}:${candidate.sampleId}:${attempt}` ||
      runIds.has(candidate.runId) ||
      candidate.model !== "qwen-vl-plus" ||
      !isIsoTimestamp(candidate.startedAt) ||
      typeof candidate.durationMs !== "number" ||
      !Number.isFinite(candidate.durationMs) ||
      candidate.durationMs < 0 ||
      !REVIEW_DECISIONS.includes(decision) ||
      !isInferenceResult(output) ||
      decision !== deriveDecision(output) ||
      (expectedMode !== undefined && mode !== expectedMode) ||
      (expectedMode === "main" && attempt !== 1)
    ) {
      throw new Error("INVALID_EVALUATION_RUNS");
    }

    runIds.add(candidate.runId);
  }

  return value as EvaluationRun[];
}

export function buildMainJobs(samples: EvaluationSample[]): EvaluationJob[] {
  return samples.map((sample) => buildJob(sample, "main", 1));
}

export function buildRepeatJobs(
  samples: EvaluationSample[],
  sampleIds: EvaluationId[],
  times: number,
): EvaluationJob[] {
  if (!Number.isInteger(times) || times < 1) {
    throw new Error("INVALID_REPEAT_TIMES");
  }

  const samplesById = new Map(samples.map((sample) => [sample.id, sample]));
  const jobs: EvaluationJob[] = [];

  for (const sampleId of new Set(sampleIds)) {
    const selectedSample = samplesById.get(sampleId);
    if (!selectedSample) throw new Error(`UNKNOWN_SAMPLE_ID:${sampleId}`);

    for (let attempt = 1; attempt <= times; attempt += 1) {
      jobs.push(buildJob(selectedSample, "repeat", attempt));
    }
  }

  return jobs;
}

export function buildRetestJobs(
  samples: EvaluationSample[],
  sampleIds: EvaluationId[],
): EvaluationJob[] {
  const samplesById = new Map(samples.map((sample) => [sample.id, sample]));

  return [...new Set(sampleIds)].map((sampleId) => {
    const selectedSample = samplesById.get(sampleId);
    if (!selectedSample) throw new Error(`UNKNOWN_SAMPLE_ID:${sampleId}`);
    return buildJob(selectedSample, "retest", 1);
  });
}

export function resumePendingJobs(
  jobs: EvaluationJob[],
  existingRuns: EvaluationRun[],
): EvaluationJob[] {
  const completedRunIds = new Set(existingRuns.map((run) => run.runId));
  return jobs.filter((job) => !completedRunIds.has(job.runId));
}
