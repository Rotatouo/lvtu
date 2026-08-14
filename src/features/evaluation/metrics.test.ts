import { describe, expect, it } from "vitest";

import {
  calculateMetrics,
  type EvaluationMetricSample,
} from "./metrics";
import type { ExpectedLocation } from "./types";

const verifiedLocation: ExpectedLocation = {
  country: "中国",
  region: "广西壮族自治区",
  city: "桂林市",
  attraction: "漓江风景名胜区",
};

function location(overrides: Partial<ExpectedLocation> = {}): ExpectedLocation {
  return { ...verifiedLocation, ...overrides };
}

function sample(overrides: Partial<EvaluationMetricSample> = {}): EvaluationMetricSample {
  return {
    id: "eval-01",
    clueTier: "text",
    expected: location(),
    actual: location(),
    expectedDecision: "confirm",
    decision: "confirm",
    confidence: "high",
    ...overrides,
  };
}

describe("calculateMetrics", () => {
  it("scores each location field independently after trimming strings", () => {
    const report = calculateMetrics([
      sample({
        expected: location({ country: "中国" }),
        actual: location({ country: "  中国  ", attraction: "漓江" }),
      }),
    ]);

    expect(report.fields.country).toEqual({ correct: 1, total: 1, rate: 1 });
    expect(report.fields.region).toEqual({ correct: 1, total: 1, rate: 1 });
    expect(report.fields.city).toEqual({ correct: 1, total: 1, rate: 1 });
    expect(report.fields.attraction).toEqual({ correct: 0, total: 1, rate: 0 });
  });

  it("treats a justified null on an unidentifiable sample as correct", () => {
    const report = calculateMetrics([
      sample({
        id: "eval-21",
        clueTier: "weak",
        expected: location({ attraction: null }),
        actual: location({ attraction: null }),
        expectedDecision: "manual",
        decision: "manual",
        confidence: "low",
      }),
    ]);

    expect(report.fields.attraction).toEqual({ correct: 1, total: 1, rate: 1 });
    expect(report.decisions.manual).toEqual({ count: 1, total: 1, rate: 1 });
    expect(report.badcaseIds).toEqual([]);
  });

  it("counts each decision independently", () => {
    const report = calculateMetrics([
      sample({ id: "eval-01", decision: "confirm", expectedDecision: "confirm" }),
      sample({ id: "eval-02", decision: "review", expectedDecision: "review" }),
      sample({ id: "eval-03", decision: "manual", expectedDecision: "manual" }),
      sample({ id: "eval-04", decision: "review", expectedDecision: "review" }),
    ]);

    expect(report.sampleCount).toBe(4);
    expect(report.decisions).toEqual({
      confirm: { count: 1, total: 4, rate: 0.25 },
      review: { count: 2, total: 4, rate: 0.5 },
      manual: { count: 1, total: 4, rate: 0.25 },
    });
  });

  it("groups sample, field, and decision metrics by clue tier", () => {
    const report = calculateMetrics([
      sample({ id: "eval-01", clueTier: "text", decision: "confirm" }),
      sample({ id: "eval-11", clueTier: "landmark", decision: "review", expectedDecision: "review" }),
      sample({
        id: "eval-21",
        clueTier: "weak",
        expected: location(),
        actual: location({ city: null }),
        decision: "manual",
        expectedDecision: "manual",
      }),
    ]);

    expect(report.tiers.text.sampleCount).toBe(1);
    expect(report.tiers.text.decisions).toEqual({
      confirm: { count: 1, total: 1, rate: 1 },
      review: { count: 0, total: 1, rate: 0 },
      manual: { count: 0, total: 1, rate: 0 },
    });
    expect(report.tiers.landmark.sampleCount).toBe(1);
    expect(report.tiers.landmark.decisions).toEqual({
      confirm: { count: 0, total: 1, rate: 0 },
      review: { count: 1, total: 1, rate: 1 },
      manual: { count: 0, total: 1, rate: 0 },
    });
    expect(report.tiers.weak.sampleCount).toBe(1);
    expect(report.tiers.weak.decisions).toEqual({
      confirm: { count: 0, total: 1, rate: 0 },
      review: { count: 0, total: 1, rate: 0 },
      manual: { count: 1, total: 1, rate: 1 },
    });
    expect(report.tiers.weak.fields.city).toEqual({ correct: 0, total: 1, rate: 0 });
    expect(report.tiers.weak.fields.country).toEqual({ correct: 1, total: 1, rate: 1 });
  });

  it("collects each field or decision mismatch once as a badcase", () => {
    const report = calculateMetrics([
      sample({ id: "eval-01" }),
      sample({ id: "eval-02", actual: location({ region: "广东省" }) }),
      sample({ id: "eval-03", decision: "review" }),
      sample({
        id: "eval-04",
        actual: location({ attraction: null }),
        decision: "manual",
      }),
    ]);

    expect(report.badcaseIds).toEqual(["eval-02", "eval-03", "eval-04"]);
  });

  it("normalizes administrative names without relaxing attraction granularity", () => {
    const report = calculateMetrics([
      sample({
        id: "eval-01",
        expected: location({ country: "中国", region: "广西", city: "桂林" }),
        actual: location({
          country: "中华人民共和国",
          region: "广西壮族自治区",
          city: "桂林市",
          attraction: "漓江",
        }),
      }),
      sample({
        id: "eval-02",
        expected: location({ region: "广东", city: "阿里" }),
        actual: location({ region: "广东省", city: "阿里地区" }),
      }),
      sample({
        id: "eval-03",
        expected: location({ region: "北京", city: "大理白族" }),
        actual: location({ region: "北京市", city: "大理白族自治州" }),
      }),
      sample({
        id: "eval-04",
        expected: location({ region: "香港" }),
        actual: location({ region: "香港特别行政区" }),
      }),
      sample({
        id: "eval-05",
        expected: location({ region: "宁夏" }),
        actual: location({ region: "宁夏回族自治区" }),
      }),
      sample({
        id: "eval-06",
        expected: location({ region: "新疆" }),
        actual: location({ region: "新疆维吾尔自治区" }),
      }),
      sample({
        id: "eval-07",
        expected: location({ region: "内蒙古" }),
        actual: location({ region: "内蒙古自治区" }),
      }),
    ]);

    expect(report.fields.country).toEqual({ correct: 7, total: 7, rate: 1 });
    expect(report.fields.region).toEqual({ correct: 7, total: 7, rate: 1 });
    expect(report.fields.city).toEqual({ correct: 7, total: 7, rate: 1 });
    expect(report.fields.attraction).toEqual({
      correct: 6,
      total: 7,
      rate: 6 / 7,
    });
    expect(report.badcaseIds).toEqual(["eval-01"]);
  });
});
