import { describe, expect, it } from "vitest";

import badcases from "../../../evaluation/badcases.json";
import manifestData from "../../../evaluation/manifest.json";
import mainRunsData from "../../../evaluation/runs/main.json";
import retestRunsData from "../../../evaluation/runs/retest.json";
import { validateBadcases } from "./badcases";
import { validateEvaluationRuns } from "./run-records";
import { validateManifest } from "./validate";

describe("checked-in evaluation badcases", () => {
  it("keeps every case linked to verified labels and real model runs", () => {
    const manifest = validateManifest(manifestData);
    const mainRuns = validateEvaluationRuns(mainRunsData, "main");
    const retestRuns = validateEvaluationRuns(retestRunsData, "retest");

    expect(
      validateBadcases(badcases, manifest, mainRuns, retestRuns),
    ).toHaveLength(5);
  });
});
