import {
  mkdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  buildEvaluationReport,
  type GeneratedEvaluationReport,
} from "../src/features/evaluation/report";

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export interface EvaluationReportFilePaths {
  manifestPath: string;
  mainRunsPath: string;
  repeatRunsPath: string;
  reportPath: string;
}

const DEFAULT_PATHS: EvaluationReportFilePaths = {
  manifestPath: resolve(REPOSITORY_ROOT, "evaluation/manifest.json"),
  mainRunsPath: resolve(REPOSITORY_ROOT, "evaluation/runs/main.json"),
  repeatRunsPath: resolve(REPOSITORY_ROOT, "evaluation/runs/repeat.json"),
  reportPath: resolve(REPOSITORY_ROOT, "evaluation/report.json"),
};

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

async function writeReportAtomically(
  targetPath: string,
  report: GeneratedEvaluationReport,
) {
  await mkdir(dirname(targetPath), { recursive: true });
  const temporaryPath = `${targetPath}.${process.pid}.tmp`;

  try {
    await writeFile(
      temporaryPath,
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    );
    await rename(temporaryPath, targetPath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

export async function buildEvaluationReportFile(
  paths: EvaluationReportFilePaths = DEFAULT_PATHS,
): Promise<GeneratedEvaluationReport> {
  const [manifest, mainRunsValue, repeatRunsValue] = await Promise.all([
    readJson(paths.manifestPath),
    readJson(paths.mainRunsPath),
    readJson(paths.repeatRunsPath),
  ]);
  const report = buildEvaluationReport(
    manifest,
    mainRunsValue,
    repeatRunsValue,
  );
  await writeReportAtomically(paths.reportPath, report);
  return report;
}

const isMainModule =
  typeof process.argv[1] === "string" &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMainModule) {
  void buildEvaluationReportFile().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "REPORT_BUILD_FAILED");
    process.exitCode = 1;
  });
}
