import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const MATERIAL_PATHS = [
  "docs/career/简历项目描述.md",
  "docs/career/三分钟面试讲稿.md",
  "docs/career/项目深挖问答.md",
  "docs/portfolio/项目案例一页纸.md",
] as const;

const LIVE_BOUNDARY =
  "三档策略来自离线评测，不是当前实时链路中的自动执行分支。";
const REALTIME_BOUNDARY = "当前实时识别结果统一进入人工确认。";
const REPLAY_BOUNDARY =
  "回放模式是保存并展示评测证据的演示，人工确认表单以人工核验值预填。";
const USER_ROLE =
  "用户提出痛点与基本功能，在对话中选择方向、批准规格和结果。";
const AGENT_ROLE =
  "AI 代理负责方案细化、代码、公开样本与标注、模型调用、测试、复测和文档草稿。";

interface EvaluationReportFixture {
  model: string;
  sampleCount: number;
  repeatRunCount: number;
  fields: Record<string, { correct: number; total: number }>;
  decisions: Record<string, { count: number }>;
  tiers: Record<string, { sampleCount: number }>;
  stability: Array<{ fullyStable: boolean }>;
}

function readUtf8(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function materials() {
  return MATERIAL_PATHS.map((path) => ({
    path,
    content: existsSync(resolve(process.cwd(), path)) ? readUtf8(path) : "",
  }));
}

function expectNumberClaims(
  content: string,
  path: string,
  pattern: RegExp,
  expected: number,
) {
  const values = [...content.matchAll(pattern)].map((match) => Number(match[1]));
  expect(values.length, `${path}: ${pattern}`).toBeGreaterThan(0);
  expect(new Set(values), `${path}: ${pattern}`).toEqual(new Set([expected]));
}

function expectFractionClaims(
  content: string,
  path: string,
  pattern: RegExp,
  expected: { correct: number; total: number },
) {
  const values = [...content.matchAll(pattern)].map((match) => [
    Number(match[1]),
    Number(match[2]),
  ]);
  expect(values.length, `${path}: ${pattern}`).toBeGreaterThan(0);
  expect(values, `${path}: ${pattern}`).toEqual(
    values.map(() => [expected.correct, expected.total]),
  );
}

describe("career material claims", () => {
  it("creates every planned UTF-8 material", () => {
    const missing = MATERIAL_PATHS.filter(
      (path) => !existsSync(resolve(process.cwd(), path)),
    );

    expect(missing).toEqual([]);
  });

  it("uses evaluation artifacts as the shared factual baseline", () => {
    const report = JSON.parse(
      readUtf8("evaluation/report.json"),
    ) as EvaluationReportFixture;
    const mainRuns = JSON.parse(
      readUtf8("evaluation/runs/main.json"),
    ) as unknown[];
    const repeatRuns = JSON.parse(
      readUtf8("evaluation/runs/repeat.json"),
    ) as unknown[];
    const badcases = JSON.parse(readUtf8("evaluation/badcases.json")) as unknown[];
    const retestRuns = JSON.parse(
      readUtf8("evaluation/runs/retest.json"),
    ) as unknown[];

    expect(mainRuns).toHaveLength(report.sampleCount);
    expect(repeatRuns).toHaveLength(report.repeatRunCount);
    expect(retestRuns).toHaveLength(badcases.length);
    const totalCalls = mainRuns.length + repeatRuns.length + retestRuns.length;
    const stableCount = report.stability.filter((item) => item.fullyStable).length;
    const tierSize = report.tiers.text.sampleCount;

    for (const material of materials()) {
      const models = [
        ...material.content.matchAll(/\b(?:qwen|gemini)[a-z0-9.-]*/gi),
      ].map((match) => match[0].toLowerCase());
      expect(models.length, material.path).toBeGreaterThan(0);
      expect(new Set(models), material.path).toEqual(new Set([report.model]));

      expectNumberClaims(
        material.content,
        material.path,
        /(\d+)\s*个主评测样本/g,
        mainRuns.length,
      );
      expectNumberClaims(
        material.content,
        material.path,
        /文字、地标、弱线索各\s*(\d+)\s*个/g,
        tierSize,
      );
      expectNumberClaims(
        material.content,
        material.path,
        /(?<!×\s)(\d+)\s*次重复调用/g,
        repeatRuns.length,
      );
      expectNumberClaims(
        material.content,
        material.path,
        /(\d+)\s*个结构化 Badcase/g,
        badcases.length,
      );
      expectNumberClaims(
        material.content,
        material.path,
        /(\d+)\s*次单变量 Prompt 复测/g,
        retestRuns.length,
      );
      expectNumberClaims(
        material.content,
        material.path,
        /(\d+)\s*次真实模型调用/g,
        totalCalls,
      );
      expectNumberClaims(
        material.content,
        material.path,
        /(\d+)\s*个完全稳定/g,
        stableCount,
      );

      for (const [label, field] of [
        ["国家", "country"],
        ["地区", "region"],
        ["城市", "city"],
        ["景点", "attraction"],
      ] as const) {
        expectFractionClaims(
          material.content,
          material.path,
          new RegExp(`${label}\\s*(\\d+)\\/(\\d+)`, "g"),
          report.fields[field],
        );
      }

      for (const [label, decision] of [
        ["可确认", "confirm"],
        ["需复核", "review"],
        ["手动录入", "manual"],
      ] as const) {
        expectNumberClaims(
          material.content,
          material.path,
          new RegExp(`(\\d+)\\s*次${label}`, "g"),
          report.decisions[decision].count,
        );
      }

      expect(material.content, material.path).toContain(
        "探索性评测，不是统计结论，也不代表用户效果",
      );
      expect(material.content, material.path).toContain(LIVE_BOUNDARY);
      expect(material.content, material.path).toContain(REALTIME_BOUNDARY);
      expect(material.content, material.path).toContain(REPLAY_BOUNDARY);
      expect(material.content, material.path).toContain(USER_ROLE);
      expect(material.content, material.path).toContain(AGENT_ROLE);
    }
  });

  it("avoids unsupported behavior, role, and user-research claims", () => {
    for (const forbidden of [
      "Gemini",
      "独立完成全部开发",
      "独立完成开发",
      "独立开发",
      "用户测试证明",
      "用户研究证明",
      "用户调研显示",
      "访谈了",
      "提升了用户",
      "提出并定义、通过 AI 编程工具辅助实现、负责验收与迭代",
      "我负责",
      "我设计",
      "我逐项",
      "我写清",
      "低置信度或国家缺失直接进入手动录入",
      "最后确认收藏或转入复核/手动录入",
      "系统降低自动化等级",
    ]) {
      for (const material of materials()) {
        expect(material.content, material.path).not.toContain(forbidden);
      }
    }
  });

  it("keeps each deliverable in its planned job-search format", () => {
    const resume = readUtf8(MATERIAL_PATHS[0]);
    const shortResume = resume.match(
      /## 简历短版([\s\S]*?)## 简历长版/,
    )?.[1];
    const shortBullets = shortResume?.match(/^- /gm) ?? [];
    expect(shortBullets.length).toBeGreaterThanOrEqual(2);
    expect(shortBullets.length).toBeLessThanOrEqual(3);
    expect(shortResume).toContain("参与选择并批准");
    expect(shortResume).toContain("由 AI 代理执行");
    expect(shortResume).toContain("依据结果作产品取舍");

    const speech = readUtf8(MATERIAL_PATHS[1]);
    expect(speech).toMatch(/## 30 秒：问题与角色/);
    expect(speech).toMatch(/## 60 秒：核心链路/);
    expect(speech).toMatch(/## 60 秒：评测与 Badcase/);
    expect(speech).toMatch(/## 30 秒：复盘与岗位匹配/);
    const spokenBody = speech
      .replace(/^#.*$/gm, "")
      .replace(/^>.*$/gm, "")
      .replace(/\s/g, "");
    expect(spokenBody.length).toBeGreaterThanOrEqual(720);
    expect(spokenBody.length).toBeLessThanOrEqual(762);

    const qa = readUtf8(MATERIAL_PATHS[2]);
    expect(qa.match(/^## Q\d+：/gm)).toHaveLength(10);
    for (const topic of [
      "qwen-vl-plus",
      "总准确率",
      "标注",
      "探索性评测",
      "低置信度",
      "AI 编程工具",
      "本人",
      "Supabase",
      "接口滥用",
      "真实需求",
    ]) {
      expect(qa).toContain(topic);
    }

    const onePager = readUtf8(MATERIAL_PATHS[3]);
    for (const section of [
      "## 问题",
      "## 方案与流程",
      "## 三项真实指标",
      "## 真实 Badcase",
      "## 个人角色",
      "## 链接",
    ]) {
      expect(onePager).toContain(section);
    }
    expect(onePager).toContain("https://github.com/Rotatouo/lvtu");
    expect(onePager).toContain("国内主链接：待部署");

    const plan = readUtf8(
      "docs/superpowers/plans/2026-08-14-lvtu-p2-career-assets-and-deployment.md",
    );
    const taskTwo =
      plan.match(/## 任务 2：[\s\S]*?(?=\n## 任务 3：)/)?.[0] ?? "";
    for (const step of [1, 2, 3, 4]) {
      expect(taskTwo).toContain(`- [x] **步骤 ${step}：`);
    }
    expect(taskTwo).toContain(
      "- [ ] **步骤 5：运行交叉声明检查并提交**",
    );
  });
});
