import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

import { buildEvaluationReportFile } from "../../../scripts/build-evaluation-report.mjs";
import { buildEvaluationReport } from "./report";
import type { EvaluationRun } from "./run-records";
import type {
  EvaluationId,
  EvaluationManifest,
  EvaluationSample,
  ExpectedLocation,
} from "./types";

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});

const expectedLocation: ExpectedLocation = {
  country: "中国",
  region: "广西",
  city: "桂林",
  attraction: "漓江",
};

function makeManifest(): EvaluationManifest {
  return Array.from({ length: 30 }, (_, index): EvaluationSample => {
    const id = `eval-${String(index + 1).padStart(2, "0")}` as EvaluationId;
    const clueTier = index < 10 ? "text" : index < 20 ? "landmark" : "weak";

    return {
      id,
      imagePath: `evaluation/images/${id}.webp`,
      clueTier,
      sourceNote: "verified source",
      expected: { ...expectedLocation },
      expectedDecision: "confirm",
      verificationNote: "verified location",
    };
  });
}

function makeRun(
  sample: EvaluationSample,
  mode: "main" | "repeat",
  attempt: number,
  overrides: Partial<EvaluationRun> = {},
): EvaluationRun {
  return {
    runId: `${mode}:${sample.id}:${attempt}`,
    sampleId: sample.id,
    mode,
    attempt,
    model: "qwen-vl-plus",
    startedAt: "2026-08-15T00:00:00.000Z",
    durationMs: 100,
    output: {
      ...sample.expected,
      confidence: "high",
      evidence: "test output",
      lat: null,
      lng: null,
      openingNote: null,
    },
    decision: sample.expectedDecision,
    ...overrides,
  };
}

function makeMainRuns(manifest: EvaluationManifest): EvaluationRun[] {
  return manifest.map((sample) => makeRun(sample, "main", 1));
}

function makeRepeatRuns(manifest: EvaluationManifest): EvaluationRun[] {
  return manifest.slice(0, 5).flatMap((sample) =>
    [1, 2, 3].map((attempt) => makeRun(sample, "repeat", attempt)),
  );
}

function output(
  location: ExpectedLocation,
  confidence: "high" | "medium" | "low" = "high",
): EvaluationRun["output"] {
  return {
    ...location,
    confidence,
    evidence: "repeat output",
    lat: null,
    lng: null,
    openingNote: null,
  };
}

describe("buildEvaluationReport", () => {
  it("builds main metrics separately from repeat-run stability", () => {
    const manifest = makeManifest();
    const mainRuns = makeMainRuns(manifest).map((run) =>
      run.sampleId === "eval-30"
        ? makeRun(manifest[29], "main", 1, {
            output: output(
              { ...expectedLocation, attraction: "象鼻山" },
              "medium",
            ),
            decision: "review",
          })
        : run,
    );
    const repeatRuns = makeRepeatRuns(manifest).map((run) => {
      if (run.sampleId !== "eval-02") return run;

      if (run.attempt === 1) {
        return makeRun(manifest[1], "repeat", 1, {
          output: output({
            country: "中国",
            region: "广西",
            city: null,
            attraction: "漓江",
          }),
          decision: "review",
        });
      }
      if (run.attempt === 2) {
        return makeRun(manifest[1], "repeat", 2, {
          output: output({
            country: "  中国  ",
            region: "广西",
            city: null,
            attraction: "漓江",
          }),
          decision: "review",
        });
      }
      return makeRun(manifest[1], "repeat", 3, {
        output: output({
          country: "中华人民共和国",
          region: "广东",
          city: "桂林",
          attraction: "象鼻山",
        }, "medium"),
        decision: "review",
      });
    });

    const report = buildEvaluationReport(manifest, mainRuns, repeatRuns);

    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(report.model).toBe("qwen-vl-plus");
    expect(report.sampleCount).toBe(30);
    expect(report.fields.country).toEqual({ correct: 30, total: 30, rate: 1 });
    expect(report.fields.region).toEqual({ correct: 30, total: 30, rate: 1 });
    expect(report.fields.attraction).toEqual({ correct: 29, total: 30, rate: 29 / 30 });
    expect(report.decisions.confirm).toEqual({ count: 29, total: 30, rate: 29 / 30 });
    expect(report.decisions.review).toEqual({ count: 1, total: 30, rate: 1 / 30 });
    expect(report.tiers.text.sampleCount).toBe(10);
    expect(report.badcaseIds).toEqual(["eval-30"]);
    expect(report.repeatRunCount).toBe(15);
    expect(report.stability).toHaveLength(5);

    const stable = report.stability.find((item) => item.sampleId === "eval-01");
    expect(stable?.fields.country).toEqual({
      uniqueValues: ["中国"],
      consistencyRate: 1,
    });
    expect(stable?.confidenceValues).toEqual(["high"]);
    expect(stable?.decisionValues).toEqual(["confirm"]);
    expect(stable?.fullyStable).toBe(true);

    const unstable = report.stability.find((item) => item.sampleId === "eval-02");
    expect(unstable?.fields.country).toEqual({
      uniqueValues: ["中国", "中华人民共和国"],
      consistencyRate: 2 / 3,
    });
    expect(unstable?.fields.region).toEqual({
      uniqueValues: ["广西", "广东"],
      consistencyRate: 2 / 3,
    });
    expect(unstable?.fields.city).toEqual({
      uniqueValues: [null, "桂林"],
      consistencyRate: 2 / 3,
    });
    expect(unstable?.confidenceValues).toEqual(["high", "medium"]);
    expect(unstable?.decisionValues).toEqual(["review"]);
    expect(unstable?.fullyStable).toBe(false);
  });

  it("validates the manifest before run counts", () => {
    expect(() => buildEvaluationReport([], [], [])).toThrow(
      "MANIFEST_REQUIRES_30_SAMPLES",
    );
  });

  it("requires 30 unique main runs that reference the manifest", () => {
    const manifest = makeManifest();
    const mainRuns = makeMainRuns(manifest);
    const repeatRuns = makeRepeatRuns(manifest);

    expect(() => buildEvaluationReport(manifest, mainRuns.slice(1), repeatRuns)).toThrow(
      "MAIN_RUNS_REQUIRE_30",
    );

    const duplicateMainRuns = [...mainRuns.slice(0, 29), mainRuns[0]];
    expect(() => buildEvaluationReport(manifest, duplicateMainRuns, repeatRuns)).toThrow(
      "INVALID_EVALUATION_RUNS",
    );

    const unknownMainRuns = [
      ...mainRuns.slice(0, 29),
      { ...mainRuns[29], sampleId: "eval-99" as EvaluationId },
    ];
    expect(() => buildEvaluationReport(manifest, unknownMainRuns, repeatRuns)).toThrow(
      "INVALID_EVALUATION_RUNS",
    );
  });

  it("validates run schemas before calculating the report", () => {
    const manifest = makeManifest();
    const mainRuns = makeMainRuns(manifest);
    const repeatRuns = makeRepeatRuns(manifest);

    expect(() =>
      buildEvaluationReport(
        manifest,
        mainRuns.map((run, index) =>
          index === 0 ? { ...run, model: "forged-model" } : run,
        ),
        repeatRuns,
      ),
    ).toThrow("INVALID_EVALUATION_RUNS");
  });

  it("requires 15 repeat runs for five known samples with three runs each", () => {
    const manifest = makeManifest();
    const mainRuns = makeMainRuns(manifest);
    const repeatRuns = makeRepeatRuns(manifest);

    expect(() => buildEvaluationReport(manifest, mainRuns, repeatRuns.slice(1))).toThrow(
      "REPEAT_RUNS_REQUIRE_15",
    );

    const fourSampleRuns = repeatRuns.map((run) => {
      if (run.sampleId !== "eval-05") return run;
      const attempt = run.attempt + 3;
      return {
        ...run,
        runId: `repeat:eval-04:${attempt}`,
        sampleId: "eval-04" as EvaluationId,
        attempt,
      };
    });
    expect(() => buildEvaluationReport(manifest, mainRuns, fourSampleRuns)).toThrow(
      "REPEAT_RUNS_REQUIRE_5_SAMPLES",
    );

    const unevenRuns = repeatRuns.map((run) =>
      run.sampleId === "eval-01" && run.attempt === 3
        ? { ...run, runId: "repeat:eval-01:4", attempt: 4 }
        : run,
    );
    expect(() => buildEvaluationReport(manifest, mainRuns, unevenRuns)).toThrow(
      "REPEAT_RUNS_REQUIRE_ATTEMPTS_1_2_3",
    );

    const unknownRepeatRuns = [
      ...repeatRuns.slice(0, 14),
      { ...repeatRuns[14], sampleId: "eval-99" as EvaluationId },
    ];
    expect(() => buildEvaluationReport(manifest, mainRuns, unknownRepeatRuns)).toThrow(
      "INVALID_EVALUATION_RUNS",
    );
  });
});

describe("buildEvaluationReportFile", () => {
  it("reads the three inputs and atomically writes report.json", async () => {
    const manifest = makeManifest();
    const directory = await mkdtemp(join(tmpdir(), "lvtu-report-"));
    tempDirectories.push(directory);

    const manifestPath = join(directory, "manifest.json");
    const mainRunsPath = join(directory, "runs", "main.json");
    const repeatRunsPath = join(directory, "runs", "repeat.json");
    const reportPath = join(directory, "output", "report.json");

    await mkdir(dirname(mainRunsPath), { recursive: true });
    await Promise.all([
      writeFile(manifestPath, JSON.stringify(manifest), "utf8"),
      writeFile(mainRunsPath, JSON.stringify(makeMainRuns(manifest)), "utf8"),
      writeFile(repeatRunsPath, JSON.stringify(makeRepeatRuns(manifest)), "utf8"),
    ]);

    const report = await buildEvaluationReportFile({
      manifestPath,
      mainRunsPath,
      repeatRunsPath,
      reportPath,
    });

    expect(JSON.parse(await readFile(reportPath, "utf8"))).toEqual(report);
    expect(await readdir(dirname(reportPath))).toEqual(["report.json"]);
  });

  it("rejects invalid run files before writing a report", async () => {
    const manifest = makeManifest();
    const directory = await mkdtemp(join(tmpdir(), "lvtu-invalid-report-"));
    tempDirectories.push(directory);

    const manifestPath = join(directory, "manifest.json");
    const mainRunsPath = join(directory, "runs", "main.json");
    const repeatRunsPath = join(directory, "runs", "repeat.json");
    const reportPath = join(directory, "output", "report.json");
    const invalidMainRuns = makeMainRuns(manifest);
    invalidMainRuns[0] = { ...invalidMainRuns[0], model: "forged-model" };

    await mkdir(dirname(mainRunsPath), { recursive: true });
    await Promise.all([
      writeFile(manifestPath, JSON.stringify(manifest), "utf8"),
      writeFile(mainRunsPath, JSON.stringify(invalidMainRuns), "utf8"),
      writeFile(repeatRunsPath, JSON.stringify(makeRepeatRuns(manifest)), "utf8"),
    ]);

    await expect(
      buildEvaluationReportFile({
        manifestPath,
        mainRunsPath,
        repeatRunsPath,
        reportPath,
      }),
    ).rejects.toThrow("INVALID_EVALUATION_RUNS");
  });
});
