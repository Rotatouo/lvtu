import badcaseData from "../../../evaluation/badcases.json";
import manifestData from "../../../evaluation/manifest.json";
import mainRunData from "../../../evaluation/runs/main.json";
import repeatRunData from "../../../evaluation/runs/repeat.json";
import retestRunData from "../../../evaluation/runs/retest.json";
import { validateBadcases } from "./badcases";
import { buildEvaluationReport } from "./report";
import { validateEvaluationRuns } from "./run-records";
import { validateManifest } from "./validate";

const manifest = validateManifest(manifestData);
const mainRuns = validateEvaluationRuns(mainRunData, "main");
const repeatRuns = validateEvaluationRuns(repeatRunData, "repeat");

export const portfolioRetestRuns = validateEvaluationRuns(
  retestRunData,
  "retest",
);

export const portfolioBadcases = validateBadcases(
  badcaseData,
  manifest,
  mainRuns,
  portfolioRetestRuns,
);

export const portfolioEvaluationReport = buildEvaluationReport(
  manifest,
  mainRuns,
  repeatRuns,
);

export const portfolioEvidenceCallCount =
  portfolioEvaluationReport.sampleCount +
  portfolioEvaluationReport.repeatRunCount +
  portfolioRetestRuns.length;
