import { describe, expect, it } from "vitest";

import {
  portfolioBadcases,
  portfolioEvidenceCallCount,
  portfolioEvaluationReport,
  portfolioRetestRuns,
} from "./portfolio-data";

describe("portfolio evaluation evidence", () => {
  it("exports only validated evidence computed from checked-in runs", () => {
    expect(portfolioEvaluationReport.sampleCount).toBe(30);
    expect(portfolioEvaluationReport.fields.city).toEqual({
      correct: 16,
      total: 30,
      rate: 16 / 30,
    });
    expect(portfolioEvaluationReport.stability).toHaveLength(5);
    expect(portfolioBadcases).toHaveLength(5);
    expect(portfolioRetestRuns).toHaveLength(5);
    expect(portfolioEvidenceCallCount).toBe(50);
  });
});
