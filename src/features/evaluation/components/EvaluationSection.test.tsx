import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type {
  EvaluationReport,
  FieldMetric,
  TierMetrics,
} from "../metrics";
import { EvaluationSection } from "./EvaluationSection";

function field(correct: number, total = 10): FieldMetric {
  return { correct, total, rate: total === 0 ? 0 : correct / total };
}

function tier(
  fieldCorrect: [number, number, number, number],
  decisions: [number, number, number],
): TierMetrics {
  return {
    sampleCount: 10,
    fields: {
      country: field(fieldCorrect[0]),
      region: field(fieldCorrect[1]),
      city: field(fieldCorrect[2]),
      attraction: field(fieldCorrect[3]),
    },
    decisions: {
      confirm: { count: decisions[0], total: 10, rate: decisions[0] / 10 },
      review: { count: decisions[1], total: 10, rate: decisions[1] / 10 },
      manual: { count: decisions[2], total: 10, rate: decisions[2] / 10 },
    },
  };
}

const report: EvaluationReport = {
  sampleCount: 30,
  fields: {
    country: field(29, 30),
    region: field(24, 30),
    city: field(21, 30),
    attraction: field(18, 30),
  },
  decisions: {
    confirm: { count: 20, total: 30, rate: 20 / 30 },
    review: { count: 6, total: 30, rate: 6 / 30 },
    manual: { count: 4, total: 30, rate: 4 / 30 },
  },
  tiers: {
    text: tier([10, 9, 8, 7], [9, 1, 0]),
    landmark: tier([10, 9, 8, 7], [7, 2, 1]),
    weak: tier([9, 6, 5, 4], [4, 3, 3]),
  },
  badcaseIds: [],
};

function expectMetric(
  name: string,
  fraction: string,
  percentage: string,
) {
  const metric = screen.getByRole("group", { name: `${name}准确率` });
  expect(within(metric).getByText(fraction)).toBeInTheDocument();
  expect(within(metric).getByText(percentage)).toBeInTheDocument();
}

describe("EvaluationSection", () => {
  it("renders the exploratory total, real field metrics, and labeled decisions", () => {
    render(<EvaluationSection report={report} />);

    expect(
      screen.getByRole("heading", { name: "30 张探索性评测" }),
    ).toBeInTheDocument();
    expectMetric("国家", "29 / 30", "96.7%");
    expectMetric("省级地区", "24 / 30", "80%");
    expectMetric("城市", "21 / 30", "70%");
    expectMetric("景点", "18 / 30", "60%");

    expect(
      within(screen.getByRole("group", { name: "自动确认 confirm" })).getByText(
        "20 / 30",
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "自动确认 confirm" })).getByText(
        "66.7%",
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "建议复核 review" })).getByText("6 / 30"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "人工判断 manual" })).getByText("4 / 30"),
    ).toBeInTheDocument();
  });

  it("switches field and decision metrics across all three clue tiers", () => {
    render(<EvaluationSection report={report} />);

    fireEvent.click(screen.getByRole("button", { name: "文字线索" }));
    expectMetric("省级地区", "9 / 10", "90%");
    expect(
      within(screen.getByRole("group", { name: "自动确认 confirm" })).getByText(
        "9 / 10",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "地标线索" }));
    expectMetric("景点", "7 / 10", "70%");
    expect(
      within(screen.getByRole("group", { name: "建议复核 review" })).getByText("2 / 10"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "弱线索" }));
    expectMetric("城市", "5 / 10", "50%");
    expect(
      within(screen.getByRole("group", { name: "人工判断 manual" })).getByText("3 / 10"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "弱线索" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
