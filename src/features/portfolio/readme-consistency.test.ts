import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

interface EvaluationReportFacts {
  model: string;
  sampleCount: number;
  repeatRunCount: number;
  fields: Record<string, { correct: number; total: number; rate: number }>;
  decisions: Record<string, { count: number; total: number; rate: number }>;
}

interface EvaluationRunFact {
  sampleId: string;
  attempt: number;
}

const readme = readFileSync("README.md", "utf8");
const report = JSON.parse(
  readFileSync("evaluation/report.json", "utf8"),
) as EvaluationReportFacts;
const retestRuns = JSON.parse(
  readFileSync("evaluation/runs/retest.json", "utf8"),
) as EvaluationRunFact[];
const mainRuns = JSON.parse(
  readFileSync("evaluation/runs/main.json", "utf8"),
) as EvaluationRunFact[];
const repeatRuns = JSON.parse(
  readFileSync("evaluation/runs/repeat.json", "utf8"),
) as EvaluationRunFact[];
const liveClassifierSource = readFileSync(
  "src/features/portfolio/components/LiveClassifier.tsx",
  "utf8",
);
const humanReviewFormSource = readFileSync(
  "src/features/portfolio/components/HumanReviewForm.tsx",
  "utf8",
);
const experienceLabSource = readFileSync(
  "src/features/portfolio/components/ExperienceLab.tsx",
  "utf8",
);
const portfolioTypesSource = readFileSync(
  "src/features/portfolio/types.ts",
  "utf8",
);

function expectOnlyNumericValue(pattern: RegExp, expected: number) {
  const values = [...readme.matchAll(pattern)].map((match) => Number(match[1]));
  expect(values.length).toBeGreaterThan(0);
  expect(new Set(values)).toEqual(new Set([expected]));
}

function expectOnlyFieldMetric(
  label: string,
  expected: { correct: number; total: number; rate: number },
) {
  const pattern = new RegExp(`${label}\\s+(\\d+)\\/(\\d+)（([\\d.]+)%）`, "gu");
  const values = [...readme.matchAll(pattern)].map((match) => match.slice(1).join("/"));
  expect(values.length).toBeGreaterThan(0);
  expect(new Set(values)).toEqual(
    new Set([
      `${expected.correct}/${expected.total}/${(expected.rate * 100).toFixed(1)}`,
    ]),
  );
}

function expectOnlyDecisionMetric(
  decision: string,
  expected: { count: number; total: number },
) {
  const pattern = new RegExp(
    "`" + decision + "`\\s+(\\d+)\\/(\\d+)",
    "gu",
  );
  const values = [...readme.matchAll(pattern)].map((match) => match.slice(1).join("/"));
  expect(values.length).toBeGreaterThan(0);
  expect(new Set(values)).toEqual(new Set([`${expected.count}/${expected.total}`]));
}

describe("README consistency", () => {
  it("uses the fixed evidence-first chapter order", () => {
    const headings = [
      "## 项目一句话",
      "## 问题与角色",
      "## 核心体验",
      "## AI 工作流",
      "## 评测方法与真实结果",
      "## Badcase",
      "## 架构",
      "## 运行",
      "## DASHSCOPE_API_KEY",
      "## 边界",
      "## 版本",
    ];

    let previousIndex = -1;
    for (const heading of headings) {
      const index = readme.indexOf(heading);
      expect(index, `${heading} should exist after the previous section`).toBeGreaterThan(
        previousIndex,
      );
      previousIndex = index;
    }
  });

  it("states only verified evaluation facts", () => {
    const realCallCount = mainRuns.length + repeatRuns.length + retestRuns.length;

    expect(report.model).toBe("qwen-vl-plus");
    expect(report.sampleCount).toBe(30);
    expect(report.repeatRunCount).toBe(15);
    expect(retestRuns).toHaveLength(5);
    expect(realCallCount).toBe(50);

    expect(readme).toContain(report.model);
    expect(readme).toContain(`${report.sampleCount} 张探索性评测`);
    expect(readme).toContain(`${report.repeatRunCount} 次重复调用`);
    expect(readme).toContain(`${retestRuns.length} 个代表性 Badcase`);
    expect(readme).toContain(`${realCallCount} 次真实调用`);
    expectOnlyNumericValue(/(\d+)\s*张探索性评测/gu, report.sampleCount);
    expectOnlyNumericValue(/(\d+)\s*次重复调用/gu, report.repeatRunCount);
    expectOnlyNumericValue(/(\d+)\s*个代表性 Badcase/gu, retestRuns.length);
    expectOnlyNumericValue(/(\d+)\s*次真实调用/gu, realCallCount);
    expectOnlyNumericValue(/(\d+)\s*条(?:真实评测记录|回放(?:记录|是))/gu, 6);
    expectOnlyNumericValue(/每类\s*(\d+)\s*张/gu, report.sampleCount / 3);
    expectOnlyNumericValue(/主评测对\s*(\d+)\s*张/gu, mainRuns.length);
    expectOnlyNumericValue(
      /另选\s*(\d+)\s*张样本/gu,
      new Set(repeatRuns.map((run) => run.sampleId)).size,
    );
    expectOnlyNumericValue(
      /每张重复\s*(\d+)\s*次/gu,
      Math.max(...repeatRuns.map((run) => run.attempt)),
    );
    expectOnlyNumericValue(/保存了\s*(\d+)\s*次主评测/gu, mainRuns.length);
    expectOnlyNumericValue(/(\d+)\s*次谨慎 Prompt 复测/gu, retestRuns.length);
    const fieldLabels = {
      country: "国家",
      region: "地区",
      city: "城市",
      attraction: "景点",
    } as const;

    for (const [field, label] of Object.entries(fieldLabels)) {
      const result = report.fields[field];
      expect(readme).toContain(
        `${label} ${result.correct}/${result.total}（${(result.rate * 100).toFixed(1)}%）`,
      );
      expectOnlyFieldMetric(label, result);
    }

    for (const [decision, result] of Object.entries(report.decisions)) {
      expectOnlyDecisionMetric(decision, result);
    }
  });

  it("describes the real ownership and product boundaries", () => {
    expect(readme).toContain("用户提出痛点与基本功能");
    expect(readme).toContain("在多轮对话中作选择并批准规格与结果");
    expect(readme).toContain(
      "AI 代理完成方案细化、实现、数据构建、模型调用、测试与文档草稿",
    );
    expect(readme).toContain("收藏仅保留在本次浏览器会话");
    expect(readme).toContain("实时识别依赖服务端环境变量");
    expect(readme).toContain("旧分支不是当前核心体验");
    expect(readme).toContain("Supabase 不作为当前核心依赖");
    expect(readme).not.toContain("AI 编程工具辅助落地");
    expect(readme).not.toContain("用户负责验收与迭代");
    expect(readme).not.toContain("选择评测标准、检查模型输出、修正错误");
    expect(readme).not.toMatch(/用户.*(?:逐项运行测试|核对 JSON|负责评测设计)/u);
  });

  it("documents the actual live-review contract instead of offline decision routing", () => {
    const reviewableResultContract = portfolioTypesSource.match(
      /export interface ReviewableResult \{([\s\S]*?)\n\}/u,
    )?.[1];

    expect(reviewableResultContract).toBeDefined();
    expect(reviewableResultContract).not.toContain("decision");
    expect(liveClassifierSource).toMatch(
      /mode: "live",[\s\S]*verified: \{[\s\S]*country: payload\.result\.country/u,
    );
    expect(experienceLabSource).toContain("onResult={setLiveResult}");
    expect(experienceLabSource).toMatch(/activeResult[\s\S]*<HumanReviewForm/u);

    expect(readme).toContain("当前实时结果统一进入人工确认");
    expect(readme).toContain("未实现 `confirm`、`review`、`manual` 自动分流");
    expect(readme).toContain("三档只属于离线评测派生的产品策略");
    expect(readme).not.toContain("结构化解析 -> 决策分级 -> 人工确认");
  });

  it("documents replay as a verified-value-prefilled evidence demo", () => {
    expect(experienceLabSource).toMatch(
      /function toReviewable[\s\S]*verified: sample\.verified/u,
    );
    expect(humanReviewFormSource).toContain("toEditableFields(result.verified)");

    expect(readme).toContain("6 条回放是保存证据的演示");
    expect(readme).toContain("回放表单由人工核验值预填");
    expect(readme).toContain("不是让用户从模型原始值开始纠错");
  });

  it("omits stale claims, secrets, and emoji", () => {
    expect(readme).not.toContain("Gemini 2.0 Flash");
    expect(readme).not.toMatch(/20\+.*用户测试/u);
    expect(readme).not.toMatch(/Mock.*完整体验/iu);
    expect(readme).not.toContain("Supabase 为核心依赖");
    expect(readme).not.toMatch(/DASHSCOPE_API_KEY\s*=/u);
    expect(readme).not.toMatch(/(?:AIza|sk-)[A-Za-z0-9_-]{12,}/u);
    expect(readme).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
