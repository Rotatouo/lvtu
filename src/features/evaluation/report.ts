import {
  calculateMetrics,
  type EvaluationMetricSample,
  type EvaluationReport,
  type LocationField,
} from "./metrics";
import {
  validateEvaluationRuns,
  type EvaluationRun,
} from "./run-records";
import type {
  EvaluationId,
  EvaluationManifest,
  ExpectedDecision,
} from "./types";
import { validateManifest } from "./validate";

const MODEL = "qwen-vl-plus" as const;
const LOCATION_FIELDS: readonly LocationField[] = [
  "country",
  "region",
  "city",
  "attraction",
];

export interface StabilityFieldMetric {
  uniqueValues: Array<string | null>;
  consistencyRate: number;
}

export interface SampleStability {
  sampleId: EvaluationId;
  fields: Record<LocationField, StabilityFieldMetric>;
  confidenceValues: EvaluationRun["output"]["confidence"][];
  decisionValues: ExpectedDecision[];
  fullyStable: boolean;
}

export interface GeneratedEvaluationReport extends EvaluationReport {
  generatedAt: string;
  model: typeof MODEL;
  repeatRunCount: number;
  stability: SampleStability[];
}

function assertKnownSamples(
  runs: readonly EvaluationRun[],
  manifestIds: ReadonlySet<string>,
) {
  for (const run of runs) {
    if (!manifestIds.has(run.sampleId)) {
      throw new Error(`UNKNOWN_SAMPLE_ID:${run.sampleId}`);
    }
  }
}

function validateMainRuns(
  runs: readonly EvaluationRun[],
  manifestIds: ReadonlySet<string>,
) {
  if (runs.length !== 30) throw new Error("MAIN_RUNS_REQUIRE_30");
  assertKnownSamples(runs, manifestIds);

  if (new Set(runs.map((run) => run.sampleId)).size !== 30) {
    throw new Error("MAIN_RUNS_REQUIRE_UNIQUE_SAMPLES");
  }
}

function validateRepeatRuns(
  runs: readonly EvaluationRun[],
  manifestIds: ReadonlySet<string>,
) {
  if (runs.length !== 15) throw new Error("REPEAT_RUNS_REQUIRE_15");
  assertKnownSamples(runs, manifestIds);

  const runCounts = new Map<EvaluationId, number>();
  for (const run of runs) {
    runCounts.set(run.sampleId, (runCounts.get(run.sampleId) ?? 0) + 1);
  }

  if (runCounts.size !== 5) {
    throw new Error("REPEAT_RUNS_REQUIRE_5_SAMPLES");
  }
  if ([...runCounts.values()].some((count) => count !== 3)) {
    throw new Error("REPEAT_RUNS_REQUIRE_3_PER_SAMPLE");
  }

  const attemptsBySample = new Map<EvaluationId, number[]>();
  for (const run of runs) {
    const attempts = attemptsBySample.get(run.sampleId) ?? [];
    attempts.push(run.attempt);
    attemptsBySample.set(run.sampleId, attempts);
  }
  if (
    [...attemptsBySample.values()].some(
      (attempts) => attempts.sort((left, right) => left - right).join(",") !== "1,2,3",
    )
  ) {
    throw new Error("REPEAT_RUNS_REQUIRE_ATTEMPTS_1_2_3");
  }
}

function uniqueValues<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function consistencyRate<T>(values: readonly T[]): number {
  const counts = new Map<T, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return values.length === 0 ? 0 : Math.max(...counts.values()) / values.length;
}

function buildStabilityField(
  runs: readonly EvaluationRun[],
  field: LocationField,
): StabilityFieldMetric {
  // Stability measures repeated raw output consistency; accuracy normalization stays in metrics.
  const values = runs.map((run) => {
    const value = run.output[field];
    return value === null ? null : value.trim();
  });

  return {
    uniqueValues: uniqueValues(values),
    consistencyRate: consistencyRate(values),
  };
}

function buildStability(
  manifest: EvaluationManifest,
  repeatRuns: readonly EvaluationRun[],
): SampleStability[] {
  const runsBySample = new Map<EvaluationId, EvaluationRun[]>();
  for (const run of repeatRuns) {
    const runs = runsBySample.get(run.sampleId) ?? [];
    runs.push(run);
    runsBySample.set(run.sampleId, runs);
  }

  return manifest
    .filter((sample) => runsBySample.has(sample.id))
    .map((sample) => {
      const runs = runsBySample.get(sample.id) ?? [];
      const fields = Object.fromEntries(
        LOCATION_FIELDS.map((field) => [field, buildStabilityField(runs, field)]),
      ) as Record<LocationField, StabilityFieldMetric>;
      const confidenceValues = uniqueValues(
        runs.map((run) => run.output.confidence),
      );
      const decisionValues = uniqueValues(
        runs.map((run) => run.decision),
      ) as ExpectedDecision[];
      const fullyStable =
        LOCATION_FIELDS.every((field) => fields[field].uniqueValues.length === 1) &&
        confidenceValues.length === 1 &&
        decisionValues.length === 1;

      return {
        sampleId: sample.id,
        fields,
        confidenceValues,
        decisionValues,
        fullyStable,
      };
    });
}

export function buildEvaluationReport(
  manifestValue: unknown,
  mainRunsValue: unknown,
  repeatRunsValue: unknown,
): GeneratedEvaluationReport {
  const manifest = validateManifest(manifestValue);
  const mainRuns = validateEvaluationRuns(mainRunsValue, "main");
  const repeatRuns = validateEvaluationRuns(repeatRunsValue, "repeat");
  const manifestIds = new Set(manifest.map((sample) => sample.id));
  validateMainRuns(mainRuns, manifestIds);
  validateRepeatRuns(repeatRuns, manifestIds);

  const mainRunsBySample = new Map(mainRuns.map((run) => [run.sampleId, run]));
  const metricSamples: EvaluationMetricSample[] = manifest.map((sample) => {
    const run = mainRunsBySample.get(sample.id) as EvaluationRun;
    return {
      id: sample.id,
      clueTier: sample.clueTier,
      expected: sample.expected,
      actual: run.output,
      expectedDecision: sample.expectedDecision,
      decision: run.decision,
      confidence: run.output.confidence,
    };
  });
  const metrics = calculateMetrics(metricSamples);

  return {
    generatedAt: new Date().toISOString(),
    model: MODEL,
    ...metrics,
    repeatRunCount: repeatRuns.length,
    stability: buildStability(manifest, repeatRuns),
  };
}
