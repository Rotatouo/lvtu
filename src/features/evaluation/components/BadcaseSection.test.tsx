import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Badcase, BadcaseCategory } from "../badcases";
import type { EvaluationRun } from "../run-records";
import type { ExpectedLocation } from "../types";
import { BadcaseSection } from "./BadcaseSection";

const CATEGORIES: BadcaseCategory[] = [
  "text-prior-conflict",
  "ocr-geography-drift",
  "landmark-granularity",
  "weak-over-inference",
  "landmark-granularity",
];

function location(prefix: string, index: number): ExpectedLocation {
  return {
    country: `${prefix}国家${index}`,
    region: `${prefix}地区${index}`,
    city: `${prefix}城市${index}`,
    attraction: `${prefix}景点${index}`,
  };
}

function badcase(index: number): Badcase {
  const suffix = String(index).padStart(2, "0");
  return {
    id: `badcase-${suffix}` as Badcase["id"],
    sampleId: `eval-${suffix}` as Badcase["sampleId"],
    baselineRunId: `main:eval-${suffix}:1`,
    category: CATEGORIES[index - 1],
    expected: location("核验", index),
    actual: location("模型", index),
    risk: `风险说明 ${index}`,
    rootCauseHypothesis: `假设：原因 ${index}`,
    productStrategy: `产品策略 ${index}`,
    retestRunIds: [`retest:eval-${suffix}:1`],
  };
}

function retestRun(index: number): EvaluationRun {
  const suffix = String(index).padStart(2, "0");
  const needsReview = index === 2;
  return {
    runId: `retest:eval-${suffix}:1`,
    sampleId: `eval-${suffix}` as EvaluationRun["sampleId"],
    mode: "retest",
    attempt: 1,
    model: "qwen-vl-plus",
    startedAt: "2026-08-15T00:00:00.000Z",
    durationMs: 20,
    output: {
      ...location("复测", index),
      confidence: needsReview ? "medium" : "high",
      evidence: `复测证据 ${index}`,
      lat: null,
      lng: null,
      openingNote: null,
    },
    decision: needsReview ? "review" : "confirm",
  };
}

const badcases = Array.from({ length: 5 }, (_, index) => badcase(index + 1));
const retestRuns = Array.from({ length: 5 }, (_, index) => retestRun(index + 1));

describe("BadcaseSection", () => {
  it("shows five selectable cases and a labeled four-field comparison", () => {
    render(<BadcaseSection badcases={badcases} retestRuns={retestRuns} />);

    expect(
      screen.getByRole("heading", { name: "错误案例与复测证据" }),
    ).toBeInTheDocument();

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");

    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByText("模型原始值")).toBeInTheDocument();
    expect(within(panel).getByText("人工核验值")).toBeInTheDocument();
    for (const field of ["国家", "地区", "城市", "景点"]) {
      expect(within(panel).getByText(field)).toBeInTheDocument();
    }
    expect(within(panel).getByText("模型城市1")).toBeInTheDocument();
    expect(within(panel).getByText("核验城市1")).toBeInTheDocument();
    expect(within(panel).getAllByText("不一致")).toHaveLength(4);
    expect(within(panel).getByText("风险说明 1")).toBeInTheDocument();
    expect(within(panel).getByText("假设：原因 1")).toBeInTheDocument();
    expect(within(panel).getByText("产品策略 1")).toBeInTheDocument();
  });

  it("switches the detail panel to the selected case", () => {
    render(<BadcaseSection badcases={badcases} retestRuns={retestRuns} />);

    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[1]);

    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByText("风险说明 2")).toBeInTheDocument();
    expect(within(panel).getByText("模型景点2")).toBeInTheDocument();
    expect(within(panel).queryByText("风险说明 1")).not.toBeInTheDocument();
  });

  it("supports arrow, Home, and End navigation across the tab list", () => {
    render(<BadcaseSection badcases={badcases} retestRuns={retestRuns} />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1, -1, -1]);

    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveFocus();

    fireEvent.keyDown(tabs[1], { key: "End" });
    expect(tabs[4]).toHaveAttribute("aria-selected", "true");
    expect(tabs[4]).toHaveFocus();

    fireEvent.keyDown(tabs[4], { key: "Home" });
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveFocus();
  });

  it("shows only the selected case retest output and a textual decision label", () => {
    render(<BadcaseSection badcases={badcases} retestRuns={retestRuns} />);

    fireEvent.click(screen.getAllByRole("tab")[1]);

    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByRole("heading", { name: "复测结果" })).toBeInTheDocument();
    expect(within(panel).getByText("retest:eval-02:1")).toBeInTheDocument();
    expect(within(panel).getByText("复测景点2")).toBeInTheDocument();
    expect(within(panel).getByText("决策：需复核")).toBeInTheDocument();
    expect(within(panel).queryByText("复测景点1")).not.toBeInTheDocument();
  });
});
