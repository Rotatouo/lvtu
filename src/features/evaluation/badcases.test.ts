import { describe, expect, it } from "vitest";

import type { InferenceResult } from "@/features/portfolio/types";

import { validateBadcases, type Badcase } from "./badcases";
import type { EvaluationRun } from "./run-records";
import type {
  EvaluationManifest,
  EvaluationSample,
  ExpectedLocation,
} from "./types";

const STARTED_AT = "2026-08-15T00:00:00.000Z";

function location(index: number): ExpectedLocation {
  return {
    country: "中国",
    region: `地区${index}`,
    city: `城市${index}`,
    attraction: `景点${index}`,
  };
}

function sample(index: number): EvaluationSample {
  const id = `eval-${String(index).padStart(2, "0")}` as EvaluationSample["id"];
  return {
    id,
    imagePath: `evaluation/images/${id}.webp`,
    clueTier: "landmark",
    sourceNote: "测试来源",
    expected: location(index),
    expectedDecision: "confirm",
    verificationNote: "测试核验说明",
  };
}

function inference(index: number): InferenceResult {
  return {
    ...location(index),
    confidence: "high",
    evidence: "测试证据",
    lat: null,
    lng: null,
    openingNote: null,
  };
}

function run(
  index: number,
  mode: EvaluationRun["mode"],
  attempt = 1,
): EvaluationRun {
  const sampleId = `eval-${String(index).padStart(2, "0")}` as EvaluationRun["sampleId"];
  return {
    runId: `${mode}:${sampleId}:${attempt}`,
    sampleId,
    mode,
    attempt,
    model: "qwen-vl-plus",
    startedAt: STARTED_AT,
    durationMs: 10,
    output: inference(index),
    decision: "confirm",
  };
}

function badcase(index: number): Badcase {
  const suffix = String(index).padStart(2, "0");
  return {
    id: `badcase-${suffix}` as Badcase["id"],
    sampleId: `eval-${suffix}` as Badcase["sampleId"],
    baselineRunId: `main:eval-${suffix}:1`,
    category: "landmark-granularity",
    expected: location(index),
    actual: location(index),
    risk: "可能误导地点判断",
    rootCauseHypothesis: "假设：模型优先采用了局部视觉特征",
    productStrategy: "降低自动确认等级并要求复核",
    retestRunIds: [`retest:eval-${suffix}:1`],
  };
}

function fixtures() {
  const manifest: EvaluationManifest = [sample(1), sample(2), sample(3)];
  const mainRuns = [run(1, "main"), run(2, "main"), run(3, "main")];
  const retestRuns = [
    run(1, "retest"),
    run(2, "retest"),
    run(3, "retest"),
  ];
  const value = [badcase(1), badcase(2), badcase(3)];
  return { manifest, mainRuns, retestRuns, value };
}

function validateFixture(
  mutate: (fixture: ReturnType<typeof fixtures>) => void,
) {
  const fixture = fixtures();
  mutate(fixture);
  return () =>
    validateBadcases(
      fixture.value,
      fixture.manifest,
      fixture.mainRuns,
      fixture.retestRuns,
    );
}

describe("validateBadcases", () => {
  it("accepts exact badcase records with consistent baseline and retest references", () => {
    const fixture = fixtures();

    expect(
      validateBadcases(
        fixture.value,
        fixture.manifest,
        fixture.mainRuns,
        fixture.retestRuns,
      ),
    ).toEqual(fixture.value);
  });

  it.each([
    ["a non-array value", () => validateBadcases({}, [], [], [])],
    [
      "fewer than three records",
      validateFixture((fixture) => {
        fixture.value = fixture.value.slice(0, 2);
      }),
    ],
    [
      "more than five records",
      validateFixture((fixture) => {
        fixture.value.push(badcase(4), badcase(5), badcase(5));
      }),
    ],
    [
      "a missing key",
      validateFixture((fixture) => {
        delete (fixture.value[0] as Partial<Badcase>).risk;
      }),
    ],
    [
      "an extra key",
      validateFixture((fixture) => {
        (fixture.value[0] as Badcase & { extra?: boolean }).extra = true;
      }),
    ],
    [
      "an out-of-range badcase ID",
      validateFixture((fixture) => {
        fixture.value[0].id = "badcase-06" as Badcase["id"];
      }),
    ],
    [
      "an unsupported category",
      validateFixture((fixture) => {
        fixture.value[0].category = "other" as Badcase["category"];
      }),
    ],
    [
      "an inexact location schema",
      validateFixture((fixture) => {
        (fixture.value[0].expected as ExpectedLocation & { extra?: string }).extra =
          "虚构字段";
      }),
    ],
    [
      "an empty risk",
      validateFixture((fixture) => {
        fixture.value[0].risk = " ";
      }),
    ],
    [
      "a root cause without the hypothesis prefix",
      validateFixture((fixture) => {
        fixture.value[0].rootCauseHypothesis = "模型优先采用了局部视觉特征";
      }),
    ],
    [
      "an empty product strategy",
      validateFixture((fixture) => {
        fixture.value[0].productStrategy = "";
      }),
    ],
    [
      "no retest references",
      validateFixture((fixture) => {
        fixture.value[0].retestRunIds = [];
      }),
    ],
  ])("rejects %s", (_label, invoke) => {
    expect(invoke).toThrow("INVALID_BADCASES");
  });

  it.each([
    [
      "an unknown sample",
      validateFixture((fixture) => {
        fixture.value[0].sampleId = "eval-30";
      }),
    ],
    [
      "a baseline run that does not exist",
      validateFixture((fixture) => {
        fixture.value[0].baselineRunId = "main:eval-01:9";
      }),
    ],
    [
      "a baseline run for another sample",
      validateFixture((fixture) => {
        fixture.value[0].baselineRunId = "main:eval-02:1";
      }),
    ],
    [
      "an expected location not found in the manifest",
      validateFixture((fixture) => {
        fixture.value[0].expected.city = "虚构城市";
      }),
    ],
    [
      "an actual location not found in the baseline output",
      validateFixture((fixture) => {
        fixture.value[0].actual.attraction = "虚构景点";
      }),
    ],
    [
      "an unknown retest run",
      validateFixture((fixture) => {
        fixture.value[0].retestRunIds = ["retest:eval-01:9"];
      }),
    ],
    [
      "duplicate retest run IDs",
      validateFixture((fixture) => {
        fixture.value[0].retestRunIds = [
          "retest:eval-01:1",
          "retest:eval-01:1",
        ];
      }),
    ],
    [
      "a non-retest run",
      validateFixture((fixture) => {
        fixture.retestRuns[0] = run(1, "repeat");
        fixture.value[0].retestRunIds = ["repeat:eval-01:1"];
      }),
    ],
    [
      "a retest run for another sample",
      validateFixture((fixture) => {
        fixture.value[0].retestRunIds = ["retest:eval-02:1"];
      }),
    ],
  ])("rejects %s", (_label, invoke) => {
    expect(invoke).toThrow("INVALID_BADCASES");
  });
});
