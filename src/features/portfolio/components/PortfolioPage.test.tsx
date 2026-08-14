import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("portfolio home", () => {
  it("renders the approved AI product case narrative", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: "把散落的旅行截图，变成可确认的目的地收藏。",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "AI 做了什么，我做了什么。" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "评测结果决定自动化边界与人工确认策略。",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "为什么主动删掉大而全。" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "30 张探索性评测" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "同一张图，模型会不会给出同一个答案？",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "错误案例与复测证据" }),
    ).toBeInTheDocument();
    expect(screen.getByText("50 次真实调用")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("不是");
  });

  it("keeps removed product branches out of primary navigation", () => {
    render(<Home />);

    expect(screen.queryByRole("link", { name: "路线" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "明信片" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "评测回放" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "实时识别" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /漓江峰林与游船/ })).toBeInTheDocument();
  });
});
