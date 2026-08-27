# 旅途 P0 可交互案例网站实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 交付证据优先、移动端清晰且具旅行氛围的案例首页，并跑通评测回放、人工确认和 DashScope 实时识别。

**架构：** 首页由小型章节组件组合；6 个回放样本从静态 TypeScript 数据加载，人工最终值只保存在客户端会话。实时识别 Route Handler 直接调用 DashScope，不创建 Supabase 记录；所有实时错误都可降级回回放模式。

**技术栈：** Next.js 16、React 19、TypeScript、Tailwind CSS 4、Framer Motion、Vitest、Testing Library、DashScope OpenAI 兼容接口。

---

## 文件结构

### 创建

- `vitest.config.mts`：Vitest、React、jsdom 和路径别名配置。
- `src/test/setup.ts`：Testing Library DOM matcher 与浏览器 API stub。
- `src/features/portfolio/types.ts`：回放样本、识别结果、最终确认结果类型。
- `src/features/portfolio/replay-samples.ts`：6 个经核验的静态回放记录。
- `src/features/portfolio/session-collection.ts`：纯函数形式的会话收藏更新逻辑。
- `src/features/portfolio/components/PortfolioNav.tsx`：五段式锚点导航。
- `src/features/portfolio/components/PortfolioHero.tsx`：价值主张、个人角色和旅行照片首屏。
- `src/features/portfolio/components/FactStrip.tsx`：真实模型、版本与主动收缩范围。
- `src/features/portfolio/components/ExperienceLab.tsx`：回放/实时模式与状态编排。
- `src/features/portfolio/components/ReplaySampleList.tsx`：6 个样本选择列表。
- `src/features/portfolio/components/InferenceEvidence.tsx`：AI 原始字段、置信度和依据。
- `src/features/portfolio/components/HumanReviewForm.tsx`：四字段编辑与确认。
- `src/features/portfolio/components/LiveClassifier.tsx`：实时上传、进度、成功和错误状态。
- `src/features/portfolio/components/RoleSection.tsx`：用户与 AI 工具角色边界。
- `src/features/portfolio/components/EvaluationPreview.tsx`：P1 数据的首页入口。
- `src/features/portfolio/components/RetrospectiveSection.tsx`：范围收缩与产品复盘。
- `src/features/portfolio/components/AboutSection.tsx`：联系方式、GitHub 和简历入口。
- `src/features/portfolio/components/TravelPath.tsx`：轻量地图路径动效与 reduced-motion 降级。
- `src/features/portfolio/components/*.test.tsx`：对应交互组件测试。
- `src/features/portfolio/*.test.ts`：类型、会话收藏和静态数据测试。
- `src/lib/dashscope.ts`：DashScope 请求、超时、解析与错误类型。
- `src/lib/dashscope.test.ts`：模型成功和异常响应测试。
- `src/app/api/classify-live/route.ts`：无 Supabase 的实时识别接口。
- `src/app/api/classify-live/route.test.ts`：文件验证、成功和错误映射测试。
- `public/portfolio/samples/sample-01.webp` 至 `sample-06.webp`：脱敏回放图片。

### 修改

- `package.json`：加入测试依赖、测试脚本，并把构建固定为 `next build --webpack`。
- `pnpm-lock.yaml`：锁定新增测试依赖。
- `pnpm-workspace.yaml`：显式批准锁文件中已核验的 `sharp` 与 `unrs-resolver` 构建脚本。
- `src/app/page.tsx`：替换为仅组合案例章节的轻量页面。
- `src/app/layout.tsx`：更新 Metadata、浅色默认主题和基础字体。
- `src/app/globals.css`：Field Notes 设计 token、响应式、焦点态和 reduced-motion。
- `next.config.ts`：设置项目根与图片配置，消除错误 workspace root 推断。
- `eslint.config.mjs`：保持严格规则，仅忽略生成目录，不屏蔽新代码问题。
- `README.md`：P0 完成后先更新模型与核心运行说明，完整重写在 P2。

### 保留但从主链路移除引用

- `src/app/journals/**`
- `src/app/postcards/**`
- `src/app/routes/**`
- `src/app/dashboard/**`
- `src/app/globe/**`
- `src/components/globe/**`
- `src/components/home/LiquidCursor.tsx`

## 任务 1：建立测试和可重复构建基线

**文件：**
- 修改：`package.json`
- 修改：`pnpm-lock.yaml`
- 修改：`pnpm-workspace.yaml`
- 创建：`vitest.config.mts`
- 创建：`src/test/setup.ts`
- 修改：`next.config.ts`

- [x] **步骤 1：修复 pnpm 11 构建许可并添加测试依赖和脚本**

先把 `pnpm-workspace.yaml` 从旧的 `ignoredBuiltDependencies` 改为明确布尔许可；只批准锁文件已包含、Next.js 运行所需的两个原生依赖：

```yaml
allowBuilds:
  sharp: true
  unrs-resolver: true
```

将以下脚本写入 `package.json`：

```json
{
  "scripts": {
    "dev": "next dev --webpack",
    "build": "next build --webpack",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

安装官方 Next.js Vitest 指南列出的依赖：

```powershell
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom vite-tsconfig-paths tsx
```

预期：`pnpm install --frozen-lockfile` 可执行；`package.json` 与 `pnpm-lock.yaml` 只增加上述测试与脚本依赖。

- [x] **步骤 2：创建 Vitest 配置和测试初始化**

```ts
// vitest.config.mts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    clearMocks: true,
  },
});
```

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
```

- [x] **步骤 3：修正 Next.js 根目录与构建器配置**

```ts
// next.config.ts
import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(process.cwd()),
  turbopack: { root: path.resolve(process.cwd()) },
};

export default nextConfig;
```

- [x] **步骤 4：运行空测试、现有 lint 与构建，记录红灯**

运行：

```powershell
pnpm test:run --passWithNoTests
pnpm lint
pnpm build
```

预期：空测试通过；lint 仍报告历史问题；build 仍因旧 `/api/classify` 的 Supabase 模块初始化失败。这两个红灯将在任务 7 收口。

- [x] **步骤 5：提交基线配置**

```powershell
git add package.json pnpm-lock.yaml pnpm-workspace.yaml vitest.config.mts src/test/setup.ts next.config.ts
git commit -m "test: add portfolio test baseline"
```

## 任务 2：定义可信数据契约与 6 个回放样本

**文件：**
- 创建：`src/features/portfolio/types.ts`
- 创建：`src/features/portfolio/replay-samples.ts`
- 创建：`src/features/portfolio/replay-samples.test.ts`
- 创建：`public/portfolio/samples/sample-01.webp` 至 `sample-06.webp`

- [x] **步骤 1：编写失败的数据完整性测试**

```ts
import { describe, expect, it } from "vitest";
import { replaySamples } from "./replay-samples";

describe("replaySamples", () => {
  it("contains two samples for each review decision", () => {
    expect(replaySamples).toHaveLength(6);
    expect(replaySamples.filter((item) => item.decision === "confirm")).toHaveLength(2);
    expect(replaySamples.filter((item) => item.decision === "review")).toHaveLength(2);
    expect(replaySamples.filter((item) => item.decision === "manual")).toHaveLength(2);
  });

  it("keeps AI values separate from verified values", () => {
    for (const item of replaySamples) {
      expect(item.ai).not.toBe(item.verified);
      expect(item.imageSrc).toMatch(/^\/portfolio\/samples\/sample-0[1-6]\.webp$/);
      expect(item.sourceNote.length).toBeGreaterThan(0);
    }
  });
});
```

- [x] **步骤 2：运行测试确认失败**

运行：`pnpm test:run src/features/portfolio/replay-samples.test.ts`

预期：FAIL，模块 `./replay-samples` 不存在。

- [x] **步骤 3：实现数据类型**

```ts
export type Confidence = "high" | "medium" | "low";
export type ReviewDecision = "confirm" | "review" | "manual";

export interface LocationFields {
  country: string | null;
  region: string | null;
  city: string | null;
  attraction: string | null;
}

export interface InferenceResult extends LocationFields {
  confidence: Confidence;
  evidence: string;
  lat: number | null;
  lng: number | null;
  openingNote: string | null;
}

export interface ReplaySample {
  id: `sample-0${1 | 2 | 3 | 4 | 5 | 6}`;
  title: string;
  clueType: "text" | "landmark" | "weak" | "conflict";
  decision: ReviewDecision;
  imageSrc: string;
  imageAlt: string;
  sourceNote: string;
  ai: InferenceResult;
  verified: LocationFields;
}

export interface ConfirmedPlace {
  sampleId: string;
  ai: InferenceResult;
  final: LocationFields;
  confirmedAt: string;
}
```

- [x] **步骤 4：准备并核验 6 个真实回放样本**

用户将 6 张允许公开展示的脱敏截图放入上述固定路径，并为每张提供可核验地点。实现者把一次真实 `qwen-vl-plus` 输出原样写入 `ai`，把用户核验答案写入 `verified`。六张必须满足 `confirm/review/manual` 各两张；不得为了配平篡改模型输出。

- [x] **步骤 5：实现 `replaySamples` 并运行测试**

实现时一次性写入 `sample-01` 至 `sample-06` 六条完整对象。每条都包含类型定义要求的全部字段，并直接引用该图片对应的真实调用记录与人工核验记录；不得提交示例常量、空字符串、虚构地点或省略项。

运行：`pnpm test:run src/features/portfolio/replay-samples.test.ts`

预期：2 tests PASS。

- [x] **步骤 6：提交静态数据契约**

```powershell
git add src/features/portfolio public/portfolio/samples
git commit -m "feat: add verified replay samples"
```

## 任务 3：实现会话收藏与人工确认组件

**文件：**
- 创建：`src/features/portfolio/session-collection.ts`
- 创建：`src/features/portfolio/session-collection.test.ts`
- 创建：`src/features/portfolio/components/InferenceEvidence.tsx`
- 创建：`src/features/portfolio/components/HumanReviewForm.tsx`
- 创建：`src/features/portfolio/components/HumanReviewForm.test.tsx`

- [x] **步骤 1：编写失败的纯函数和组件测试**

```ts
import { expect, it } from "vitest";
import { upsertConfirmedPlace } from "./session-collection";

it("replaces a confirmation without mutating the AI result", () => {
  const first = makeConfirmedPlace("桂林市");
  const next = upsertConfirmedPlace([first], { ...first, final: { ...first.final, city: "阳朔县" } });
  expect(next).toHaveLength(1);
  expect(next[0].final.city).toBe("阳朔县");
  expect(next[0].ai.city).toBe(first.ai.city);
});
```

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { HumanReviewForm } from "./HumanReviewForm";

it("submits edited final values and preserves the AI values", () => {
  const onConfirm = vi.fn();
  render(<HumanReviewForm sample={mediumConfidenceSample} onConfirm={onConfirm} />);
  fireEvent.change(screen.getByLabelText("城市"), { target: { value: "阳朔县" } });
  fireEvent.click(screen.getByRole("button", { name: "确认并加入本次收藏" }));
  expect(onConfirm.mock.calls[0][0].final.city).toBe("阳朔县");
  expect(onConfirm.mock.calls[0][0].ai.city).toBe(mediumConfidenceSample.ai.city);
});
```

- [x] **步骤 2：运行测试确认失败**

运行：`pnpm test:run src/features/portfolio/session-collection.test.ts src/features/portfolio/components/HumanReviewForm.test.tsx`

预期：FAIL，函数和组件不存在。

- [x] **步骤 3：实现最小会话收藏逻辑**

```ts
export function upsertConfirmedPlace(
  collection: ConfirmedPlace[],
  incoming: ConfirmedPlace,
): ConfirmedPlace[] {
  return [incoming, ...collection.filter((item) => item.sampleId !== incoming.sampleId)];
}
```

- [x] **步骤 4：实现证据展示与人工确认表单**

`InferenceEvidence` 必须显示模式标签、置信度文字、`evidence` 和四个 AI 原始字段。`HumanReviewForm` 用受控输入初始化 `verified` 值，提交时创建新的 `final` 对象和 ISO 时间，不修改 `sample.ai`。

- [x] **步骤 5：运行测试和局部 lint**

```powershell
pnpm test:run src/features/portfolio/session-collection.test.ts src/features/portfolio/components/HumanReviewForm.test.tsx
pnpm exec eslint src/features/portfolio/session-collection.ts src/features/portfolio/components/InferenceEvidence.tsx src/features/portfolio/components/HumanReviewForm.tsx
```

预期：全部通过，无 lint 输出。

- [x] **步骤 6：提交人工确认链路**

```powershell
git add src/features/portfolio
git commit -m "feat: add human review flow"
```

## 任务 4：移除实时识别对 Supabase 的依赖

**文件：**
- 创建：`src/lib/dashscope.ts`
- 创建：`src/lib/dashscope.test.ts`
- 创建：`src/app/api/classify-live/route.ts`
- 创建：`src/app/api/classify-live/route.test.ts`

- [x] **步骤 1：编写失败的 DashScope 解析测试**

```ts
import { describe, expect, it } from "vitest";
import { parseDashScopeContent } from "./dashscope";

describe("parseDashScopeContent", () => {
  it("normalizes a structured model response", () => {
    expect(parseDashScopeContent('{"country":"中国","region":"广西壮族自治区","city":"桂林市","attraction":"漓江风景名胜区","confidence":"medium","evidence":"喀斯特峰林与竹筏","lat":25.1631,"lng":110.4305,"opening_note":null}')).toEqual({
      country: "中国",
      region: "广西壮族自治区",
      city: "桂林市",
      attraction: "漓江风景名胜区",
      confidence: "medium",
      evidence: "喀斯特峰林与竹筏",
      lat: 25.1631,
      lng: 110.4305,
      openingNote: null,
    });
  });

  it("rejects text without a JSON object", () => {
    expect(() => parseDashScopeContent("无法识别")).toThrow("MODEL_RESPONSE_INVALID");
  });
});
```

- [x] **步骤 2：编写失败的 Route Handler 测试**

```ts
import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

it("rejects unsupported files before calling the model", async () => {
  const form = new FormData();
  form.set("file", new File(["text"], "note.txt", { type: "text/plain" }));
  const response = await POST(new Request("http://localhost/api/classify-live", { method: "POST", body: form }));
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ code: "FILE_TYPE_UNSUPPORTED", message: "仅支持 JPG、PNG、WebP 格式" });
});
```

- [x] **步骤 3：运行测试确认失败**

运行：`pnpm test:run src/lib/dashscope.test.ts src/app/api/classify-live/route.test.ts`

预期：FAIL，模块不存在。

- [x] **步骤 4：实现模型客户端**

`classifyTravelImage` 接收 `ArrayBuffer`、MIME 和注入式 `fetch`，从 `process.env.DASHSCOPE_API_KEY` 读取密钥，使用 `AbortSignal.timeout(20_000)`，调用 `qwen-vl-plus`。错误只返回以下公开代码：`MODEL_NOT_CONFIGURED`、`MODEL_TIMEOUT`、`MODEL_UPSTREAM_ERROR`、`MODEL_RESPONSE_INVALID`；错误消息和日志不得包含请求头或密钥。

- [x] **步骤 5：实现无数据库 Route Handler**

```ts
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return jsonError(400, "FILE_REQUIRED", "请选择一张旅行截图");
  if (!ALLOWED_TYPES.has(file.type)) return jsonError(400, "FILE_TYPE_UNSUPPORTED", "仅支持 JPG、PNG、WebP 格式");
  if (file.size > MAX_BYTES) return jsonError(400, "FILE_TOO_LARGE", "图片大小不能超过 10MB");
  const result = await classifyTravelImage(await file.arrayBuffer(), file.type);
  return Response.json({ mode: "live", result });
}
```

- [x] **步骤 6：运行测试、局部 lint 和无环境变量构建**

```powershell
pnpm test:run src/lib/dashscope.test.ts src/app/api/classify-live/route.test.ts
pnpm exec eslint src/lib/dashscope.ts src/app/api/classify-live/route.ts
pnpm build
```

预期：测试和 lint 通过；构建不再因新接口要求 Supabase。旧 `/api/classify` 仍可能触发失败，在任务 7 处理。

- [x] **步骤 7：提交实时识别接口**

```powershell
git add src/lib/dashscope.ts src/lib/dashscope.test.ts src/app/api/classify-live
git commit -m "feat: add stateless live classification"
```

## 任务 5：实现双模式体验实验室

**文件：**
- 创建：`src/features/portfolio/components/ReplaySampleList.tsx`
- 创建：`src/features/portfolio/components/LiveClassifier.tsx`
- 创建：`src/features/portfolio/components/ExperienceLab.tsx`
- 创建：`src/features/portfolio/components/ExperienceLab.test.tsx`

- [x] **步骤 1：编写失败的模式切换和错误降级测试**

```tsx
it("clearly separates replay and live modes", () => {
  render(<ExperienceLab samples={replaySamples} />);
  expect(screen.getByText("真实评测记录")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "实时识别" }));
  expect(screen.getByText("实时模型调用")).toBeInTheDocument();
  expect(screen.queryByText("真实评测记录")).not.toBeInTheDocument();
});

it("offers replay after a live request fails", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "模型服务暂时不可用" }), { status: 503 })));
  render(<ExperienceLab samples={replaySamples} />);
  fireEvent.click(screen.getByRole("tab", { name: "实时识别" }));
  await uploadFixture(screen.getByLabelText("选择旅行截图"));
  expect(await screen.findByRole("button", { name: "返回评测记录回放" })).toBeInTheDocument();
});
```

- [x] **步骤 2：运行测试确认失败**

运行：`pnpm test:run src/features/portfolio/components/ExperienceLab.test.tsx`

预期：FAIL，组件不存在。

- [x] **步骤 3：实现三个组件**

`ExperienceLab` 管理 `mode`、选中样本、实时结果和会话收藏；`ReplaySampleList` 使用可见文本同时表达线索类别与决策状态；`LiveClassifier` 只接受单张图片并向 `/api/classify-live` 提交。所有 tab、输入和状态须有可访问名称。

- [x] **步骤 4：运行组件测试和局部 lint**

运行：

```powershell
pnpm test:run src/features/portfolio/components/ExperienceLab.test.tsx
pnpm exec eslint src/features/portfolio/components/ExperienceLab.tsx src/features/portfolio/components/ReplaySampleList.tsx src/features/portfolio/components/LiveClassifier.tsx
```

预期：全部通过。

- [x] **步骤 5：提交双模式体验**

```powershell
git add src/features/portfolio/components
git commit -m "feat: add replay and live experience lab"
```

## 任务 6：实现 Field Notes 案例首页与动效

**文件：**
- 创建：`src/features/portfolio/components/PortfolioNav.tsx`
- 创建：`src/features/portfolio/components/PortfolioHero.tsx`
- 创建：`src/features/portfolio/components/FactStrip.tsx`
- 创建：`src/features/portfolio/components/RoleSection.tsx`
- 创建：`src/features/portfolio/components/EvaluationPreview.tsx`
- 创建：`src/features/portfolio/components/RetrospectiveSection.tsx`
- 创建：`src/features/portfolio/components/AboutSection.tsx`
- 创建：`src/features/portfolio/components/TravelPath.tsx`
- 创建：`src/features/portfolio/components/PortfolioPage.test.tsx`
- 修改：`src/app/page.tsx`
- 修改：`src/app/layout.tsx`
- 修改：`src/app/globals.css`

- [x] **步骤 1：编写失败的页面结构测试**

```tsx
it("renders the approved portfolio narrative in order", () => {
  render(<Home />);
  const headings = screen.getAllByRole("heading").map((item) => item.textContent);
  expect(headings).toEqual(expect.arrayContaining([
    "把散落的旅行截图，变成可确认的目的地收藏。",
    "AI 做了什么，我做了什么。",
    "评测结果决定自动化边界与人工确认策略。",
    "为什么主动删掉大而全。",
  ]));
  expect(screen.queryByRole("link", { name: "路线" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "明信片" })).not.toBeInTheDocument();
});
```

- [x] **步骤 2：运行测试确认失败**

运行：`pnpm test:run src/features/portfolio/components/PortfolioPage.test.tsx`

预期：FAIL，现有首页仍显示旧导航和 Mock 工作流。

- [x] **步骤 3：把 `src/app/page.tsx` 收缩为组合层**

```tsx
import { AboutSection } from "@/features/portfolio/components/AboutSection";
import { ExperienceLab } from "@/features/portfolio/components/ExperienceLab";
import { PortfolioHero } from "@/features/portfolio/components/PortfolioHero";
import { replaySamples } from "@/features/portfolio/replay-samples";

export default function Home() {
  return (
    <main>
      <PortfolioHero />
      <ExperienceLab samples={replaySamples} />
      <RoleSection />
      <EvaluationPreview />
      <RetrospectiveSection />
      <AboutSection />
    </main>
  );
}
```

- [x] **步骤 4：实现 Field Notes token 与响应式布局**

在 `globals.css` 定义 `--paper`、`--ink`、`--field-green`、`--signal-lime`、`--line`、`--muted`；所有章节使用全宽带状布局和受限内容宽度。390px 宽度下体验区按样本 → 模型证据 → 人工确认单列排列，固定控件不得超出视口。

- [x] **步骤 5：实现氛围与 reduced-motion**

`TravelPath` 使用 Framer Motion 绘制一次性路径进入；旅行照片仅在首屏和章节锚点使用轻微裁切过渡；模式、字段标记和确认状态使用 150–300ms 动画。CSS 与组件同时检查 `prefers-reduced-motion`，关闭路径绘制、景深位移和计数动画。

- [x] **步骤 6：更新 Metadata**

```ts
export const metadata: Metadata = {
  title: "旅途｜AI 产品案例",
  description: "从旅行截图识别到人工确认的 AI 应用产品案例，包含真实体验、探索性评测与 Badcase 复盘。",
};
```

- [x] **步骤 7：运行页面测试、局部 lint 和构建**

```powershell
pnpm test:run src/features/portfolio/components/PortfolioPage.test.tsx
pnpm exec eslint src/app/page.tsx src/app/layout.tsx src/features/portfolio/components
pnpm build
```

预期：页面测试和局部 lint 通过；构建如果仍失败，只能来自未移除的旧 Supabase Route Handler，任务 7 收口。

- [x] **步骤 8：提交案例首页**

```powershell
git add src/app src/features/portfolio/components
git commit -m "feat: rebuild home as AI product case study"
```

## 任务 7：收口历史接口与整仓质量门禁

**文件：**
- 修改：`src/app/api/classify/route.ts`
- 创建：`src/app/api/classify/route.test.ts`
- 修改：`src/lib/supabase.ts`
- 修改：`eslint.config.mjs`
- 修改：P0 触及的所有 lint 报错文件

- [x] **步骤 1：为旧接口写兼容性测试**

`/api/classify` 不再初始化 Supabase；它应返回 308 或调用同一无状态分类实现。推荐保留 API 路径并调用 `classify-live` 共用函数，避免旧链接直接 404。

```ts
it("does not require Supabase configuration", async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  const module = await import("./route");
  expect(module.POST).toBeTypeOf("function");
});
```

- [x] **步骤 2：运行测试确认旧接口红灯**

运行：`pnpm test:run src/app/api/classify/route.test.ts`

预期：FAIL，导入时抛出 `supabaseUrl is required`。

- [x] **步骤 3：改造旧接口并删除首页对旧 API 的引用**

把文件上传、校验和模型调用复用到无状态实现；不得写 Supabase。旧 `src/lib/supabase.ts` 仅由隐藏页面接口延迟调用，不能在模块顶层创建客户端。

- [x] **步骤 4：清理整仓 lint 历史错误**

优先删除已经不再引用的旧首页内部代码和 imports。隐藏功能保留源码时，修复确定性 lint 问题；对于 React Three Fiber 中经确认属于命令式渲染模式的规则冲突，仅对具体文件和具体规则添加带原因的 override，禁止全局关闭 `react-hooks` 规则。

- [x] **步骤 5：运行全部质量门禁**

```powershell
pnpm test:run
pnpm lint
pnpm build
git diff --check
```

预期：测试全部通过；lint 0 errors；Webpack 生产构建成功；无空白错误。

- [x] **步骤 6：提交质量收口**

```powershell
git add src/app/api src/lib/supabase.ts eslint.config.mjs
git commit -m "fix: remove portfolio Supabase dependency"
```

## 任务 8：浏览器验收与移动端视觉验证

**文件：**
- 创建：`docs/verification/p0-browser-checklist.md`
- 修改：视觉缺陷涉及的 P0 组件和样式文件

- [x] **步骤 1：启动生产式本地服务**

```powershell
pnpm build
pnpm start -- -p 3100
```

预期：`http://localhost:3100` 可访问。

- [x] **步骤 2：用浏览器验证桌面 1440×900**

检查首屏品牌与照片可见、主导航五项可用、体验入口进入可视区域、回放/实时模式切换、样本选择、字段修改、确认收藏和错误降级。保存首屏、体验区、评测预览和 Badcase 入口截图。

- [x] **步骤 3：用浏览器验证移动端 390×844**

检查文本不溢出，tab 可点击，四字段输入不横向滚动，确认按钮不被遮挡，照片不压住正文，导航可达。

- [x] **步骤 4：验证 reduced-motion**

开启 `prefers-reduced-motion: reduce`，确认地图路径、景深和计数动画关闭，模式和错误状态仍清晰。

- [x] **步骤 5：记录证据并修复所有发现的问题**

`docs/verification/p0-browser-checklist.md` 记录视口、步骤、结果和截图路径。每个修复后重新运行相关组件测试和截图检查。

- [x] **步骤 6：最终提交 P0**

```powershell
git add src docs/verification
git commit -m "test: verify portfolio experience across viewports"
```
