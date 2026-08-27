import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { ExperienceLab } from "./ExperienceLab";
import type { ReplaySample } from "../types";

const sample: ReplaySample = {
  id: "sample-01",
  title: "测试样本",
  clueType: "landmark",
  decision: "review",
  imageSrc: "/portfolio/samples/sample-01.webp",
  imageAlt: "测试旅行图",
  sourceNote: "测试夹具",
  ai: {
    country: "中国",
    region: "广西壮族自治区",
    city: "桂林市",
    attraction: "漓江风景名胜区",
    confidence: "medium",
    evidence: "峰林与水域",
    lat: 25.2,
    lng: 110.4,
    openingNote: null,
  },
  verified: {
    country: "中国",
    region: "广西壮族自治区",
    city: "桂林市",
    attraction: "漓江风景名胜区",
  },
};

afterEach(() => vi.unstubAllGlobals());

it("clearly separates replay and live modes", () => {
  render(<ExperienceLab samples={[sample]} />);
  expect(screen.getByText("真实评测记录")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("tab", { name: "实时识别" }));

  expect(screen.getByText("实时模型调用")).toBeInTheDocument();
  expect(screen.queryByText("真实评测记录")).not.toBeInTheDocument();
});

it("requires an image before starting live recognition", () => {
  render(<ExperienceLab samples={[sample]} />);
  fireEvent.click(screen.getByRole("tab", { name: "实时识别" }));

  expect(screen.getByRole("button", { name: "开始识别" })).toBeDisabled();
});

it("offers replay after a live request fails", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({ message: "模型服务暂时不可用" }, { status: 503 }),
    ),
  );
  render(<ExperienceLab samples={[sample]} />);
  fireEvent.click(screen.getByRole("tab", { name: "实时识别" }));

  const input = screen.getByLabelText("选择旅行截图");
  fireEvent.change(input, {
    target: { files: [new File(["image"], "trip.png", { type: "image/png" })] },
  });
  fireEvent.click(screen.getByRole("button", { name: "开始识别" }));

  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: "返回评测记录回放" }),
    ).toBeInTheDocument();
  });
});

it("clears a previous result before a later live request fails", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        result: {
          country: "中国",
          region: "广东省",
          city: "深圳市",
          attraction: "第一次识别地点",
          confidence: "high",
          evidence: "测试依据",
          lat: null,
          lng: null,
          openingNote: null,
        },
      }),
    )
    .mockResolvedValueOnce(
      Response.json({ message: "模型服务暂时不可用" }, { status: 503 }),
    );
  vi.stubGlobal("fetch", fetchMock);
  render(<ExperienceLab samples={[sample]} />);
  fireEvent.click(screen.getByRole("tab", { name: "实时识别" }));

  const input = screen.getByLabelText("选择旅行截图");
  fireEvent.change(input, {
    target: { files: [new File(["first"], "first.png", { type: "image/png" })] },
  });
  fireEvent.click(screen.getByRole("button", { name: "开始识别" }));
  expect(await screen.findByDisplayValue("第一次识别地点")).toBeInTheDocument();

  fireEvent.change(input, {
    target: { files: [new File(["second"], "second.png", { type: "image/png" })] },
  });
  fireEvent.click(screen.getByRole("button", { name: "开始识别" }));

  await waitFor(() => {
    expect(screen.getByRole("alert")).toHaveTextContent("模型服务暂时不可用");
  });
  expect(screen.queryByDisplayValue("第一次识别地点")).not.toBeInTheDocument();
});
