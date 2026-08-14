import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { DashScopeError } from "@/lib/dashscope";
import type { InferenceResult } from "@/features/portfolio/types";
import type { EvaluationSample } from "./types";
import {
  buildMainJobs,
  buildRepeatJobs,
  deriveDecision,
  resumePendingJobs,
  validateEvaluationRuns,
  type EvaluationRun,
} from "./run-records";
// @ts-expect-error -- Vitest resolves .mts imports; the app tsconfig disallows TS extensions.
import { parseCliArgs, readExistingRuns, runCli, runEvaluationJobs, writeRunsAtomically } from "../../../scripts/run-evaluation.mts";

const STARTED_AT = "2026-08-15T00:00:00.000Z";

function inference(overrides: Partial<InferenceResult> = {}): InferenceResult {
  return {
    country: "China",
    region: "Guangxi",
    city: "Guilin",
    attraction: "Li River",
    confidence: "high",
    evidence: "Test evidence",
    lat: null,
    lng: null,
    openingNote: null,
    ...overrides,
  };
}

function sample(index: number): EvaluationSample {
  const id = `eval-${String(index).padStart(2, "0")}` as EvaluationSample["id"];
  return {
    id,
    imagePath: `evaluation/images/${id}.webp`,
    clueTier: index <= 10 ? "text" : index <= 20 ? "landmark" : "weak",
    sourceNote: "Test source",
    expected: {
      country: "China",
      region: "Guangxi",
      city: "Guilin",
      attraction: "Li River",
    },
    expectedDecision: "confirm",
    verificationNote: "Test verification note",
  };
}

function completedRun(overrides: Partial<EvaluationRun> = {}): EvaluationRun {
  return {
    runId: "main:eval-01:1",
    sampleId: "eval-01",
    mode: "main",
    attempt: 1,
    model: "qwen-vl-plus",
    startedAt: STARTED_AT,
    durationMs: 5,
    output: inference(),
    decision: "confirm",
    ...overrides,
  };
}

function invalidRun(
  mutate: (run: Record<string, unknown>) => void,
): unknown[] {
  const run = structuredClone(completedRun()) as unknown as Record<string, unknown>;
  mutate(run);
  return [run];
}

function mutateOutput(
  mutate: (output: Record<string, unknown>) => void,
): unknown[] {
  return invalidRun((run) => {
    const output = run.output as Record<string, unknown>;
    mutate(output);
  });
}

describe("deriveDecision", () => {
  it.each([
    { output: inference({ confidence: "low" }), expected: "manual" },
    { output: inference({ country: null }), expected: "manual" },
    { output: inference(), expected: "confirm" },
    { output: inference({ attraction: null }), expected: "review" },
    { output: inference({ confidence: "medium" }), expected: "review" },
  ] as const)("returns $expected for the supplied inference", ({ output, expected }) => {
    expect(deriveDecision(output)).toBe(expected);
  });
});

describe("validateEvaluationRuns", () => {
  it("accepts exact run schemas and returns typed records", () => {
    const main = completedRun();
    const repeat = completedRun({
      runId: "repeat:eval-02:3",
      sampleId: "eval-02",
      mode: "repeat",
      attempt: 3,
    });
    const retest = completedRun({
      runId: "retest:eval-30:2",
      sampleId: "eval-30",
      mode: "retest",
      attempt: 2,
      output: inference({ country: null }),
      decision: "manual",
    });

    expect(validateEvaluationRuns([main], "main")).toEqual([main]);
    expect(validateEvaluationRuns([repeat], "repeat")).toEqual([repeat]);
    expect(validateEvaluationRuns([retest])).toEqual([retest]);
  });

  it.each([
    ["a non-array value", {}],
    ["a missing top-level field", invalidRun((run) => delete run.model)],
    ["an extra top-level field", invalidRun((run) => { run.extra = true; })],
    ["an invalid sample ID", invalidRun((run) => { run.sampleId = "eval-31"; })],
    ["an invalid mode", invalidRun((run) => { run.mode = "preview"; })],
    ["a non-positive attempt", invalidRun((run) => { run.attempt = 0; })],
    ["a fractional attempt", invalidRun((run) => { run.attempt = 1.5; })],
    ["a mismatched run ID", invalidRun((run) => { run.runId = "main:eval-02:1"; })],
    ["an unsupported model", invalidRun((run) => { run.model = "other-model"; })],
    ["an invalid ISO timestamp", invalidRun((run) => { run.startedAt = "2026-08-15"; })],
    ["a negative duration", invalidRun((run) => { run.durationMs = -1; })],
    ["an infinite duration", invalidRun((run) => { run.durationMs = Infinity; })],
    ["an invalid decision", invalidRun((run) => { run.decision = "approve"; })],
    ["a missing output field", mutateOutput((output) => delete output.evidence)],
    ["an extra output field", mutateOutput((output) => { output.extra = true; })],
    ["an empty location", mutateOutput((output) => { output.city = " "; })],
    ["a non-string location", mutateOutput((output) => { output.city = 1; })],
    ["an invalid confidence", mutateOutput((output) => { output.confidence = "certain"; })],
    ["empty evidence", mutateOutput((output) => { output.evidence = " "; })],
    ["an out-of-range latitude", mutateOutput((output) => { output.lat = 91; })],
    ["an infinite latitude", mutateOutput((output) => { output.lat = Infinity; })],
    ["an out-of-range longitude", mutateOutput((output) => { output.lng = -181; })],
    ["a non-string opening note", mutateOutput((output) => { output.openingNote = 1; })],
    [
      "a decision inconsistent with its output",
      invalidRun((run) => { run.decision = "review"; }),
    ],
  ])("rejects %s", (_label, value) => {
    expect(() => validateEvaluationRuns(value)).toThrow(
      "INVALID_EVALUATION_RUNS",
    );
  });

  it("rejects duplicate run IDs", () => {
    const run = completedRun();
    expect(() => validateEvaluationRuns([run, run])).toThrow(
      "INVALID_EVALUATION_RUNS",
    );
  });

  it("enforces expected main and repeat modes", () => {
    const mainAttemptTwo = completedRun({
      runId: "main:eval-01:2",
      attempt: 2,
    });

    expect(() => validateEvaluationRuns([mainAttemptTwo], "main")).toThrow(
      "INVALID_EVALUATION_RUNS",
    );
    expect(() => validateEvaluationRuns([completedRun()], "repeat")).toThrow(
      "INVALID_EVALUATION_RUNS",
    );
  });
});

describe("evaluation jobs", () => {
  it("builds one deterministic main job per sample", () => {
    expect(buildMainJobs([sample(1), sample(2)])).toEqual([
      {
        runId: "main:eval-01:1",
        sampleId: "eval-01",
        imagePath: "evaluation/images/eval-01.webp",
        mode: "main",
        attempt: 1,
      },
      {
        runId: "main:eval-02:1",
        sampleId: "eval-02",
        imagePath: "evaluation/images/eval-02.webp",
        mode: "main",
        attempt: 1,
      },
    ]);
  });

  it("builds every requested repeat attempt", () => {
    const jobs = buildRepeatJobs(
      [sample(1), sample(2), sample(3)],
      ["eval-01", "eval-03"],
      3,
    );

    expect(jobs).toHaveLength(6);
    expect(jobs.map((job) => job.runId)).toEqual([
      "repeat:eval-01:1",
      "repeat:eval-01:2",
      "repeat:eval-01:3",
      "repeat:eval-03:1",
      "repeat:eval-03:2",
      "repeat:eval-03:3",
    ]);
    expect(jobs.map((job) => job.attempt)).toEqual([1, 2, 3, 1, 2, 3]);
  });

  it("rejects unknown repeat sample IDs", () => {
    expect(() => buildRepeatJobs([sample(1)], ["eval-02"], 3)).toThrow(
      "UNKNOWN_SAMPLE_ID:eval-02",
    );
  });

  it("resumes by removing jobs with completed run IDs", () => {
    const jobs = buildMainJobs([sample(1), sample(2)]);

    expect(resumePendingJobs(jobs, [completedRun()])).toEqual([jobs[1]]);
  });
});

describe("evaluation CLI", () => {
  it("parses main and repeat selections", () => {
    expect(parseCliArgs(["--main"])).toEqual({ mode: "main" });
    expect(
      parseCliArgs(["--repeat", "eval-01,eval-11", "--times", "3"]),
    ).toEqual({ mode: "repeat", sampleIds: ["eval-01", "eval-11"], times: 3 });
  });

  it("fails before reading files or invoking the model without an API key", async () => {
    await expect(runCli(["--main"], { NODE_ENV: "test" })).rejects.toThrow(
      "DASHSCOPE_API_KEY is not configured",
    );
  });

  it("rejects invalid existing records instead of treating their run IDs as complete", async () => {
    const directory = await mkdtemp(join(tmpdir(), "lvtu-existing-runs-"));
    const target = join(directory, "main.json");

    try {
      await writeRunsAtomically(target, [
        completedRun({ model: "forged-model" }),
      ]);
      await expect(readExistingRuns(target, "main")).rejects.toThrow(
        "INVALID_EVALUATION_RUNS",
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("runs jobs sequentially and persists each successful record", async () => {
    const jobs = buildMainJobs([sample(1), sample(2)]);
    const persist = vi.fn().mockResolvedValue(undefined);
    const log = vi.fn();
    let activeCalls = 0;
    let maximumActiveCalls = 0;
    const classify = vi.fn(async () => {
      activeCalls += 1;
      maximumActiveCalls = Math.max(maximumActiveCalls, activeCalls);
      await Promise.resolve();
      activeCalls -= 1;
      return inference();
    });
    const now = vi
      .fn()
      .mockReturnValueOnce(Date.parse(STARTED_AT))
      .mockReturnValueOnce(Date.parse(STARTED_AT) + 5)
      .mockReturnValueOnce(Date.parse(STARTED_AT) + 10)
      .mockReturnValueOnce(Date.parse(STARTED_AT) + 18);

    const runs = await runEvaluationJobs({
      jobs,
      existingRuns: [],
      apiKey: "test-key",
      classify,
      readImage: vi.fn().mockResolvedValue(new ArrayBuffer(2)),
      persist,
      log,
      now,
    });

    expect(maximumActiveCalls).toBe(1);
    expect(runs).toHaveLength(2);
    expect(persist).toHaveBeenCalledTimes(2);
    expect(persist.mock.calls[0][0]).toHaveLength(1);
    expect(persist.mock.calls[1][0]).toHaveLength(2);
    expect(log.mock.calls).toEqual([
      ["eval-01 5ms success"],
      ["eval-02 8ms success"],
    ]);
  });

  it("logs only the public DashScope error code for a failed job", async () => {
    const log = vi.fn();
    const persist = vi.fn();
    const now = vi
      .fn()
      .mockReturnValueOnce(Date.parse(STARTED_AT))
      .mockReturnValueOnce(Date.parse(STARTED_AT) + 7);

    const runs = await runEvaluationJobs({
      jobs: buildMainJobs([sample(1)]),
      existingRuns: [],
      apiKey: "secret-must-not-appear",
      classify: vi.fn().mockRejectedValue(new DashScopeError("MODEL_TIMEOUT")),
      readImage: vi.fn().mockResolvedValue(new ArrayBuffer(2)),
      persist,
      log,
      now,
    });

    expect(runs).toEqual([]);
    expect(persist).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith("eval-01 7ms MODEL_TIMEOUT");
    expect(JSON.stringify(log.mock.calls)).not.toContain("secret-must-not-appear");
  });

  it("atomically replaces the run file without leaving a temp file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "lvtu-evaluation-"));
    const target = join(directory, "main.json");

    try {
      await writeRunsAtomically(target, [completedRun()]);
      await writeRunsAtomically(target, [
        completedRun(),
        completedRun({ runId: "main:eval-02:1", sampleId: "eval-02" }),
      ]);

      expect(JSON.parse(await readFile(target, "utf8"))).toHaveLength(2);
      expect(await readdir(directory)).toEqual(["main.json"]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
