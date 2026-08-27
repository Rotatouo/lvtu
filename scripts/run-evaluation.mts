import {
  mkdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { InferenceResult } from "../src/features/portfolio/types";
import type { EvaluationId } from "../src/features/evaluation/types";
import {
  buildMainJobs,
  buildRepeatJobs,
  deriveDecision,
  resumePendingJobs,
  validateEvaluationRuns,
  type EvaluationJob,
  type EvaluationMode,
  type EvaluationRun,
} from "../src/features/evaluation/run-records";
import { validateManifest } from "../src/features/evaluation/validate";
import {
  classifyTravelImage,
  DashScopeError,
} from "../src/lib/dashscope";

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = resolve(REPOSITORY_ROOT, "evaluation/manifest.json");
const MODEL = "qwen-vl-plus";

export type Classifier = (
  bytes: ArrayBuffer,
  mimeType: string,
  options: { apiKey: string; prompt?: string },
) => Promise<InferenceResult>;

type CliSelection =
  | { mode: "main" }
  | { mode: "repeat"; sampleIds: EvaluationId[]; times: number };

export interface RunEvaluationJobsOptions {
  jobs: EvaluationJob[];
  existingRuns: EvaluationRun[];
  apiKey: string;
  prompt?: string;
  classify?: Classifier;
  readImage?: (imagePath: string) => Promise<ArrayBuffer>;
  persist: (runs: EvaluationRun[]) => Promise<void>;
  log?: (line: string) => void;
  now?: () => number;
}

function usageError(): never {
  throw new Error(
    "USAGE: --main | --repeat eval-01,eval-02 --times 3",
  );
}

async function readImageFromRepository(imagePath: string) {
  const bytes = await readFile(resolve(REPOSITORY_ROOT, imagePath));
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

export async function readExistingRuns(
  targetPath: string,
  expectedMode: EvaluationMode,
): Promise<EvaluationRun[]> {
  try {
    const value = JSON.parse(await readFile(targetPath, "utf8")) as unknown;
    return validateEvaluationRuns(value, expectedMode);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export function parseCliArgs(args: string[]): CliSelection {
  if (args.length === 1 && args[0] === "--main") return { mode: "main" };

  if (
    args.length === 4 &&
    args[0] === "--repeat" &&
    args[2] === "--times"
  ) {
    const sampleIds = args[1]
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean) as EvaluationId[];
    const times = Number(args[3]);
    if (sampleIds.length === 0 || !Number.isInteger(times) || times < 1) {
      return usageError();
    }
    return { mode: "repeat", sampleIds, times };
  }

  return usageError();
}

export async function writeRunsAtomically(
  targetPath: string,
  runs: EvaluationRun[],
) {
  await mkdir(dirname(targetPath), { recursive: true });
  const temporaryPath = `${targetPath}.${process.pid}.tmp`;

  try {
    await writeFile(temporaryPath, `${JSON.stringify(runs, null, 2)}\n`, "utf8");
    await rename(temporaryPath, targetPath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

export async function runEvaluationJobs({
  jobs,
  existingRuns,
  apiKey,
  prompt,
  classify = classifyTravelImage,
  readImage = readImageFromRepository,
  persist,
  log = console.log,
  now = Date.now,
}: RunEvaluationJobsOptions): Promise<EvaluationRun[]> {
  let runs = [...existingRuns];
  const pendingJobs = resumePendingJobs(jobs, existingRuns);

  for (const job of pendingJobs) {
    const startedAtMs = now();
    let output: InferenceResult;

    try {
      const imageBytes = await readImage(job.imagePath);
      output = await classify(
        imageBytes,
        "image/webp",
        prompt === undefined ? { apiKey } : { apiKey, prompt },
      );
    } catch (error) {
      if (!(error instanceof DashScopeError)) throw error;
      const durationMs = Math.max(0, now() - startedAtMs);
      log(`${job.sampleId} ${durationMs}ms ${error.code}`);
      continue;
    }

    const durationMs = Math.max(0, now() - startedAtMs);
    const run: EvaluationRun = {
      runId: job.runId,
      sampleId: job.sampleId,
      mode: job.mode,
      attempt: job.attempt,
      model: MODEL,
      startedAt: new Date(startedAtMs).toISOString(),
      durationMs,
      output,
      decision: deriveDecision(output),
    };

    runs = [...runs, run];
    await persist(runs);
    log(`${job.sampleId} ${durationMs}ms success`);
  }

  return runs;
}

export async function runCli(
  args = process.argv.slice(2),
  environment: NodeJS.ProcessEnv = process.env,
) {
  const apiKey = environment.DASHSCOPE_API_KEY?.trim();
  if (!apiKey) throw new Error("DASHSCOPE_API_KEY is not configured");

  const selection = parseCliArgs(args);
  const manifest = validateManifest(
    JSON.parse(await readFile(MANIFEST_PATH, "utf8")),
  );
  const targetPath = resolve(
    REPOSITORY_ROOT,
    selection.mode === "main"
      ? "evaluation/runs/main.json"
      : "evaluation/runs/repeat.json",
  );
  const existingRuns = await readExistingRuns(targetPath, selection.mode);
  const jobs =
    selection.mode === "main"
      ? buildMainJobs(manifest)
      : buildRepeatJobs(manifest, selection.sampleIds, selection.times);

  return runEvaluationJobs({
    jobs,
    existingRuns,
    apiKey,
    persist: (runs) => writeRunsAtomically(targetPath, runs),
  });
}

function safeCliError(error: unknown) {
  if (
    error instanceof Error &&
    (error.message === "DASHSCOPE_API_KEY is not configured" ||
      error.message.startsWith("USAGE:"))
  ) {
    return error.message;
  }
  return "EVALUATION_FAILED";
}

const isMainModule =
  typeof process.argv[1] === "string" &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMainModule) {
  void runCli().catch((error: unknown) => {
    console.error(safeCliError(error));
    process.exitCode = 1;
  });
}
