# 旅途求职作品集重塑实现计划索引

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在 2026-08-21 前把「旅途」重塑为可运行、可评测、可用于深圳 AI 产品经理实习投递的单项目深度案例。

**架构：** 先交付不依赖 Supabase 的静态案例与评测回放，再接通 DashScope 实时识别；随后用结构化评测数据生成指标和 Badcase，最后完成 README、求职材料与 EdgeOne 部署。三个计划按 P0 → P1 → P2 顺序执行，每份计划都能形成独立可验收成果。

**技术栈：** Next.js 16 App Router、React 19、TypeScript、Tailwind CSS 4、Framer Motion、Vitest、Testing Library、DashScope `qwen-vl-plus`、EdgeOne Pages。

---

## 执行顺序

1. [P0 可投递网站与核心体验](./2026-08-14-lvtu-p0-interactive-case-study.md)
2. [P1 评测证据与 Badcase](./2026-08-14-lvtu-p1-evaluation-evidence.md)
3. [P2 求职材料与部署](./2026-08-14-lvtu-p2-career-assets-and-deployment.md)

## 已知基线

- 隔离工作区：`.worktrees/lvtu-portfolio-redesign`
- 分支：`codex/lvtu-portfolio-redesign`
- `next build --webpack` 已完成编译和 TypeScript 检查，随后因旧 `/api/classify` 在模块加载阶段要求 Supabase URL 而失败。
- 默认 Turbopack 在当前中文绝对路径触发 Next.js 16 内部字符边界崩溃；本项目本地和 CI 构建统一使用官方支持的 `next build --webpack`。
- 整仓 ESLint 基线为 45 个错误、36 个警告，主要位于旧页面、3D 地球和已决定隐藏的功能。P0 要删除新首页对这些模块的引用，并在最终构建门禁前清理或定向隔离剩余历史问题。
- 仓库当前没有自动化测试框架。P0 的第一个任务安装并配置 Vitest 与 Testing Library。
- 不使用、不读取、不输出任何 API Key。需要真实调用时，仅检查 `DASHSCOPE_API_KEY` 是否存在。

## 总体验收门禁

- [ ] `pnpm test --run` 全部通过。
- [ ] `pnpm lint` 无错误。
- [ ] `pnpm build` 使用 Webpack 并成功生成生产构建。
- [ ] 核心体验在未配置 DashScope 时仍可完整回放。
- [ ] 配置 DashScope 后实时识别成功，错误降级可复现。
- [ ] 桌面 1440×900、移动端 390×844 无遮挡、溢出和空白主场景。
- [ ] README、页面、评测报告、简历材料中的模型和数字一致。
- [ ] EdgeOne 国内主链接和 Vercel 备用链接由用户实际打开确认。

