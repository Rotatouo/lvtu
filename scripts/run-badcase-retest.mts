import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  buildRetestJobs,
  type EvaluationRun,
} from "../src/features/evaluation/run-records";
import type { EvaluationId } from "../src/features/evaluation/types";
import { validateManifest } from "../src/features/evaluation/validate";
import {
  readExistingRuns,
  runEvaluationJobs,
  writeRunsAtomically,
  type Classifier,
} from "./run-evaluation.mjs";

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_MANIFEST_PATH = resolve(REPOSITORY_ROOT, "evaluation/manifest.json");
const DEFAULT_TARGET_PATH = resolve(REPOSITORY_ROOT, "evaluation/runs/retest.json");

export const BADCASE_IDS = [
  "eval-04",
  "eval-08",
  "eval-11",
  "eval-21",
  "eval-25",
] as const satisfies readonly EvaluationId[];

export const CAUTIOUS_PROMPT =
  "Identify the travel location using only text visibly present in the image or a uniquely identifiable landmark. Generic road names must not be used to infer a city. If similar landmarks cannot be distinguished with confidence, lower the confidence and leave uncertain location fields null. Do not guess. Return only JSON with country, region, city, attraction, confidence (high|medium|low), evidence, lat, lng, and opening_note.";

export interface BadcaseRetestOptions {
  environment?: NodeJS.ProcessEnv;
  manifestPath?: string;
  targetPath?: string;
  classify?: Classifier;
  readImage?: (imagePath: string) => Promise<ArrayBuffer>;
  log?: (line: string) => void;
  now?: () => number;
}

export async function runBadcaseRetest({
  environment = process.env,
  manifestPath = DEFAULT_MANIFEST_PATH,
  targetPath = DEFAULT_TARGET_PATH,
  classify,
  readImage,
  log,
  now,
}: BadcaseRetestOptions = {}): Promise<EvaluationRun[]> {
  const apiKey = environment.DASHSCOPE_API_KEY?.trim();
  if (!apiKey) throw new Error("DASHSCOPE_API_KEY is not configured");

  const manifest = validateManifest(
    JSON.parse(await readFile(manifestPath, "utf8")),
  );
  const existingRuns = await readExistingRuns(targetPath, "retest");

  return runEvaluationJobs({
    jobs: buildRetestJobs(manifest, [...BADCASE_IDS]),
    existingRuns,
    apiKey,
    prompt: CAUTIOUS_PROMPT,
    classify,
    readImage,
    persist: (runs) => writeRunsAtomically(targetPath, runs),
    log,
    now,
  });
}

const isMainModule =
  typeof process.argv[1] === "string" &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMainModule) {
  void runBadcaseRetest().catch((error: unknown) => {
    console.error(
      error instanceof Error &&
        error.message === "DASHSCOPE_API_KEY is not configured"
        ? error.message
        : "RETEST_FAILED",
    );
    process.exitCode = 1;
  });
}
