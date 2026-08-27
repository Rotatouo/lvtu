import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SampleStability } from "../report";
import { StabilitySection } from "./StabilitySection";

const stability: SampleStability[] = [
  {
    sampleId: "eval-01",
    fields: {
      country: { uniqueValues: ["中国"], consistencyRate: 1 },
      region: { uniqueValues: ["北京市"], consistencyRate: 1 },
      city: { uniqueValues: ["北京市"], consistencyRate: 1 },
      attraction: { uniqueValues: ["王府井大街"], consistencyRate: 1 },
    },
    confidenceValues: ["high"],
    decisionValues: ["confirm"],
    fullyStable: true,
  },
  {
    sampleId: "eval-02",
    fields: {
      country: { uniqueValues: ["中国"], consistencyRate: 1 },
      region: { uniqueValues: [null, "山东省"], consistencyRate: 2 / 3 },
      city: { uniqueValues: [null, "青岛市"], consistencyRate: 2 / 3 },
      attraction: { uniqueValues: ["东大桥路", null], consistencyRate: 2 / 3 },
    },
    confidenceValues: ["high", "low"],
    decisionValues: ["review", "manual"],
    fullyStable: false,
  },
];

describe("StabilitySection", () => {
  it("shows repeated-run consistency and changing confidence without color-only meaning", () => {
    render(<StabilitySection stability={stability} repeatRunCount={6} />);

    expect(
      screen.getByRole("heading", { name: "同一张图，模型会不会给出同一个答案？" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 个样本 × 3 次调用")).toBeInTheDocument();
    expect(screen.getByText("完全稳定")).toBeInTheDocument();
    expect(screen.getByText("存在波动")).toBeInTheDocument();
    expect(screen.getAllByText("67%").length).toBeGreaterThan(0);
    expect(screen.getByText("高 → 低")).toBeInTheDocument();
    expect(screen.getByText("复核 → 手动录入")).toBeInTheDocument();
  });
});
