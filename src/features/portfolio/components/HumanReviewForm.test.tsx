import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { HumanReviewForm } from "./HumanReviewForm";
import type { ReviewableResult } from "../types";

const mediumConfidenceSample: ReviewableResult = {
  id: "sample-test",
  mode: "replay",
  ai: {
    country: "中国",
    region: "广西壮族自治区",
    city: "桂林市",
    attraction: "漓江风景名胜区",
    confidence: "medium",
    evidence: "喀斯特峰林与竹筏",
    lat: 25.1631,
    lng: 110.4305,
    openingNote: null,
  },
  verified: {
    country: "中国",
    region: "广西壮族自治区",
    city: "桂林市",
    attraction: "漓江风景名胜区",
  },
};

it("submits edited final values and preserves the AI values", () => {
  const onConfirm = vi.fn();
  render(
    <HumanReviewForm
      now={() => new Date("2026-08-14T00:00:00.000Z")}
      onConfirm={onConfirm}
      result={mediumConfidenceSample}
    />,
  );

  fireEvent.change(screen.getByLabelText("城市"), {
    target: { value: "阳朔县" },
  });
  fireEvent.click(screen.getByRole("button", { name: "确认并加入本次收藏" }));

  expect(onConfirm).toHaveBeenCalledOnce();
  expect(onConfirm.mock.calls[0][0].final.city).toBe("阳朔县");
  expect(onConfirm.mock.calls[0][0].ai.city).toBe("桂林市");
  expect(onConfirm.mock.calls[0][0].confirmedAt).toBe("2026-08-14T00:00:00.000Z");
});
