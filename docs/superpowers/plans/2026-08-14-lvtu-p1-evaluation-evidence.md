# 旅途 P1 评测证据与 Badcase 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 建立 30 张可复核的探索性评测集、15 次稳定性调用记录、字段级指标和 3 至 5 个真实 Badcase。

**架构：** 评测输入和原始输出使用版本化 JSON；纯函数完成 Schema 校验和指标计算；页面只渲染真实计算结果。评测脚本调用 P0 的 DashScope 客户端，不读取或打印密钥。

**技术栈：** TypeScript、Vitest、Node.js 脚本、Next.js、DashScope `qwen-vl-plus`。

---

## 文件结构

- 创建：`evaluation/manifest.json`：30 张样本的人工标注与来源说明。
- 创建：`evaluation/images/eval-01.webp` 至 `eval-30.webp`：脱敏评测图片。
- 创建：`evaluation/runs/main.json`：30 次主评测原始输出。
- 创建：`evaluation/runs/repeat.json`：5 张 × 3 次重复调用记录。
- 创建：`evaluation/report.json`：由脚本生成的指标和 Badcase 索引。
- 创建：`src/features/evaluation/types.ts`：Schema 对应类型。
- 创建：`src/features/evaluation/validate.ts`：清单与运行记录校验。
- 创建：`src/features/evaluation/validate.test.ts`：数量、分层与来源字段校验测试。
- 创建：`src/features/evaluation/metrics.ts`：字段正确率和决策结果计算。
- 创建：`src/features/evaluation/metrics.test.ts`：口径测试。
- 创建：`scripts/run-evaluation.mts`：顺序调用模型并原子写入运行记录。
- 创建：`scripts/build-evaluation-report.mts`：生成报告。
- 创建：`src/features/evaluation/components/EvaluationSection.tsx`：样本分层和指标。
- 创建：`src/features/evaluation/components/BadcaseSection.tsx`：AI 与人工值对比。
- 创建：`src/features/evaluation/components/StabilitySection.tsx`：重复测试稳定性。
- 创建：`src/features/evaluation/components/EvaluationSection.test.tsx`：指标渲染测试。
- 创建：`src/features/evaluation/components/BadcaseSection.test.tsx`：原始值与核验值对比测试。
- 修改：`src/app/page.tsx`：接入完整评测章节。

## 任务 1：定义评测 Schema 与人工标注清单

- [ ] **步骤 1：编写失败的清单校验测试**

```ts
it("requires exactly ten samples per clue tier", () => {
  expect(() => validateManifest(makeManifest({ text: 10, landmark: 10, weak: 9 }))).toThrow("MANIFEST_REQUIRES_30_SAMPLES");
  expect(validateManifest(makeManifest({ text: 10, landmark: 10, weak: 10 }))).toHaveLength(30);
});

it("requires a verified source note for every sample", () => {
  expect(() => validateManifest([{ ...validSample, sourceNote: "" }])).toThrow("SOURCE_NOTE_REQUIRED");
});
```

- [ ] **步骤 2：运行测试确认失败**

运行：`pnpm test:run src/features/evaluation/validate.test.ts`

预期：FAIL，校验模块不存在。

- [ ] **步骤 3：实现类型与校验**

每个样本固定包含：`id`、`imagePath`、`clueTier`、`sourceNote`、`expected` 四字段、`expectedDecision`、`verificationNote`。ID 必须是 `eval-01` 至 `eval-30`，三类各 10 张。

- [ ] **步骤 4：用户准备并核验 30 张图片**

用户按固定文件名放入图片，填写准确地点和核验依据；实现者运行校验器。若公开平台素材没有明确授权，改用用户自有截图或具备公开使用条件的图片，不以技术手段绕过授权。

- [ ] **步骤 5：运行校验测试并提交**

```powershell
pnpm test:run src/features/evaluation/validate.test.ts
git add evaluation/manifest.json evaluation/images src/features/evaluation/types.ts src/features/evaluation/validate.ts src/features/evaluation/validate.test.ts
git commit -m "data: add verified evaluation manifest"
```

## 任务 2：实现字段级与决策级指标

- [ ] **步骤 1：编写失败的指标口径测试**

```ts
it("scores each location field independently", () => {
  const report = calculateMetrics([run({ country: true, region: true, city: true, attraction: false })]);
  expect(report.fields.country).toEqual({ correct: 1, total: 1, rate: 1 });
  expect(report.fields.attraction).toEqual({ correct: 0, total: 1, rate: 0 });
});

it("treats a justified null on an unidentifiable sample as correct", () => {
  const report = calculateMetrics([unidentifiableRun({ attraction: null, confidence: "low" })]);
  expect(report.fields.attraction.correct).toBe(1);
  expect(report.decisions.manual).toBe(1);
});
```

- [ ] **步骤 2：运行测试确认失败**

运行：`pnpm test:run src/features/evaluation/metrics.test.ts`

预期：FAIL，`calculateMetrics` 不存在。

- [ ] **步骤 3：实现纯函数指标计算**

输出结构固定为：

```ts
interface EvaluationReport {
  sampleCount: 30;
  fields: Record<"country" | "region" | "city" | "attraction", { correct: number; total: number; rate: number }>;
  decisions: { confirm: number; review: number; manual: number };
  tiers: Record<"text" | "landmark" | "weak", TierMetrics>;
  badcaseIds: string[];
}
```

- [ ] **步骤 4：运行测试和局部 lint**

```powershell
pnpm test:run src/features/evaluation/metrics.test.ts
pnpm exec eslint src/features/evaluation/metrics.ts
```

预期：全部通过。

- [ ] **步骤 5：提交指标计算**

```powershell
git add src/features/evaluation
git commit -m "feat: add evaluation metrics"
```

## 任务 3：运行 30 张主评测与 15 次重复测试

- [ ] **步骤 1：实现安全评测脚本**

脚本先检查 `DASHSCOPE_API_KEY` 是否存在，只输出样本 ID、耗时、成功或公开错误代码；不得输出环境变量、Authorization header 或完整 Base64。每完成一张便原子写入临时文件并重命名，支持从已有 ID 继续。

- [ ] **步骤 2：验证缺少环境变量时安全退出**

运行：`Remove-Item Env:DASHSCOPE_API_KEY -ErrorAction SilentlyContinue; pnpm exec tsx scripts/run-evaluation.mts --main`

预期：退出码 1，输出 `DASHSCOPE_API_KEY is not configured`，不生成运行记录。

- [ ] **步骤 3：由用户在本机环境配置变量后运行主评测**

运行：`pnpm exec tsx scripts/run-evaluation.mts --main`

预期：`evaluation/runs/main.json` 含 30 条记录，每个 ID 唯一。

- [ ] **步骤 4：运行重复测试**

选择 `text` 2 张、`landmark` 2 张、`weak` 1 张，每张调用 3 次：

运行：`pnpm exec tsx scripts/run-evaluation.mts --repeat eval-01,eval-02,eval-11,eval-12,eval-21 --times 3`

预期：`evaluation/runs/repeat.json` 含 15 条记录。

- [ ] **步骤 5：构建报告并校验数量**

运行：

```powershell
pnpm exec tsx scripts/build-evaluation-report.mts
pnpm test:run src/features/evaluation
```

预期：`report.json.sampleCount === 30`，重复记录为 15 条，不混入主指标。

- [ ] **步骤 6：提交真实评测记录**

```powershell
git add evaluation/runs evaluation/report.json scripts
git commit -m "data: record qwen evaluation runs"
```

## 任务 4：归因 3 至 5 个真实 Badcase

- [ ] **步骤 1：从报告中选取真实错误**

至少覆盖弱线索过度推断、文字与画面冲突、粒度不一致三类；若某类未在真实运行中出现，不得虚构，改选实际出现的错误类型。

- [ ] **步骤 2：为每个 Badcase 写结构化记录**

每项包含 `expected`、`actual`、`risk`、`rootCauseHypothesis`、`productStrategy` 和 `retestRunIds`。原因使用“假设”措辞，除非有 Prompt 对照实验支持因果结论。

- [ ] **步骤 3：执行策略复测**

只修改一个变量：Prompt 或输出规则；保留改动前后运行 ID。复测结果无改善也要如实记录。

- [ ] **步骤 4：运行 Schema 和数量测试**

运行：`pnpm test:run src/features/evaluation`

预期：Badcase 数量在 3 至 5，每项引用存在的主评测和复测记录。

- [ ] **步骤 5：提交 Badcase**

```powershell
git add evaluation src/features/evaluation
git commit -m "docs: document model badcases"
```

## 任务 5：实现评测、稳定性与 Badcase 页面章节

- [ ] **步骤 1：编写失败的渲染测试**

```tsx
it("renders only metrics from the generated report", () => {
  render(<EvaluationSection report={verifiedReport} />);
  expect(screen.getByText("30 张探索性评测")).toBeInTheDocument();
  expect(screen.getByText(formatRate(verifiedReport.fields.city.rate))).toBeInTheDocument();
});

it("compares original and final fields in a badcase", () => {
  render(<BadcaseSection badcases={[verifiedBadcase]} />);
  expect(screen.getByText("模型原始值")).toBeInTheDocument();
  expect(screen.getByText("人工核验值")).toBeInTheDocument();
});
```

- [ ] **步骤 2：运行测试确认失败**

运行：`pnpm test:run src/features/evaluation/components`

预期：FAIL，组件不存在。

- [ ] **步骤 3：实现三个章节并接入首页**

指标使用真实分子、分母和百分比；三类样本支持筛选；稳定性表格显示字段一致性和置信度变化；Badcase 可切换 AI 原始值与人工核验值。颜色之外必须有文字标签。

- [ ] **步骤 4：运行测试、lint、构建和浏览器截图**

```powershell
pnpm test:run
pnpm lint
pnpm build
```

预期：全部通过。随后验证 1440×900 与 390×844，确保图表标签和长地名不溢出。

- [ ] **步骤 5：提交 P1 页面**

```powershell
git add src evaluation/report.json
git commit -m "feat: publish evaluation evidence"
```
