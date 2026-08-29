# 旅途 · Journey

<p align="center">
  <b>刷到一张想去的地方，截图丢进来，AI 替你认出这是哪儿，自动归档成一张会生长的世界地图。</b>
</p>

<p align="center">
  <a href="https://lvtu-kueq.vercel.app" target="_blank">🌍 国际节点</a>
  &nbsp;·&nbsp;
  <a href="#-在线体验">🇨🇳 国内节点</a>
  &nbsp;·&nbsp;
  <a href="#-快速开始">🚀 本地运行</a>
  &nbsp;·&nbsp;
  <a href="#-功能一览">✨ 功能介绍</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/DashScope-qwen--vl--plus-FF6A00?logo=alibaba-cloud" alt="DashScope" />
</p>

---

## 🌐 在线体验

| 节点 | 地址 | 说明 |
| --- | --- | --- |
| 🇨🇳 国内主站 | 腾讯 EdgeOne Pages | 国内访问更快，部署中 |
| 🌍 国际备用 | <https://lvtu-kueq.vercel.app> | Vercel 托管，全球可用 |

---

## ✨ 功能一览

| 功能 | 说明 |
| --- | --- |
| 📸 **AI 截图识别** | 拖入小红书 / 抖音 / 微博旅行截图，自动读出国家、城市、景点并归档。**支持一次拖入多张批量识别**（最多 20 张，3 条并发） |
| 🗺️ **心愿地图** | 想去 / 去过两种状态，卡片瀑布流与 3D 地球双视图自由切换 |
| 🛤️ **路线规划** | 把心愿地点串成路线，拖动排序、随时增删，自动生成带编号的可视化地图 |
| 📝 **旅程记录** | 去过的地方可以写日记，AI 顺手生成一句「旅途印记」 |
| 🎑 **明信片导出** | 把日记排版成 4 种风格的明信片，一键导出 PNG |
| 🏆 **我的旅程** | 经验值 / 等级 / 徽章体系，附带 AI 目的地推荐 |
| 🌗 **深浅双主题** | 全局外观一键切换，偏好保存在本地，刷新不丢 |

---

## 🛠 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Next.js 16（App Router）+ React 19 |
| 样式 | Tailwind CSS 4（CSS 变量令牌 + `@theme inline`） |
| 数据库 / 存储 | Supabase（PostgreSQL + Storage） |
| AI 视觉识别 | 阿里云 DashScope `qwen-vl-plus` |
| AI 文本生成 | 阿里云 DashScope `qwen-plus`（旅途印记、目的地推荐） |
| 3D 地球 | Three.js + `@react-three/fiber` + `@react-three/drei` |
| 2D 地图 | Leaflet + react-leaflet |
| 交互动画 | Framer Motion、dnd-kit |
| 图片导出 | html2canvas |
| 部署 | 腾讯 EdgeOne Pages（主）+ Vercel（备） |

> 💡 `src/lib/gemini.ts` 只是历史遗留文件名，项目从未真正调用 Gemini，当前全部走 DashScope。

---

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 准备 Supabase

1. 在 [supabase.com](https://supabase.com) 创建一个免费项目
2. 进入 SQL Editor，按顺序执行仓库根目录的迁移脚本：
   ```
   supabase-migration.sql
   → supabase-migration-v0.4.sql
   → supabase-migration-v0.4.1.sql
   → supabase-migration-v0.5.sql
   ```
3. 在 Storage 中新建名为 `images` 的公开存储桶
4. 记录 Project URL、anon key、service role key

### 3. 准备 DashScope API Key

前往 [阿里云百炼控制台](https://bailian.console.aliyun.com/) 开通 DashScope 并创建 API Key。
`qwen-vl-plus` 与 `qwen-plus` 均有免费额度，个人用量基本不花钱。

### 4. 配置环境变量

```bash
cp .env.example .env.local
```

```ini
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DASHSCOPE_API_KEY=sk-...
```

可选：`DASHSCOPE_TIMEOUT_MS`（默认 `45000`，视觉模型调用的代码层超时，详见下文踩坑记录）

### 5. 启动开发服务器

```bash
pnpm dev
```

打开 <http://localhost:3000> 即可使用。

### 6. 部署

- **Vercel**：导入仓库并配置上述 4 个环境变量即可自动部署
- **腾讯 EdgeOne Pages**：绑定 GitHub 仓库后，按平台指引配置构建命令与环境变量

⚠️ **注意**：Serverless 平台默认函数超时通常为 10s，本项目在 `/api/classify/route.ts` 中通过 `export const maxDuration = 60` 延长至 60s。迁移到其他平台时请务必同步调整。

---

## 📁 项目结构

```
src/
├── app/
│   ├── page.tsx            首页（HERO + 卡片网格 + 3D 地球）
│   ├── journals/           旅程记录
│   ├── postcards/          明信片生成
│   ├── dashboard/          我的旅程（等级 / 徽章 / AI 推荐）
│   ├── routes/             路线规划（含可视化地图）
│   ├── globe/              3D 地球全屏页
│   ├── cover/              开场动画页
│   ├── globals.css         设计令牌 + 主题 + Leaflet 适配 + 动画
│   └── api/
│       ├── classify/       上传截图 + AI 识别（核心链路）
│       ├── works/          心愿 CRUD
│       ├── journals/       日记 CRUD
│       ├── routes/         路线与路线项 CRUD、排序
│       ├── quotes/         AI 生成旅途印记
│       ├── recommend/      AI 推荐目的地
│       ├── tiles/          地图瓦片代理
│       └── weather/        天气
├── components/
│   ├── UploadZone.tsx      拖拽上传 + 批量队列（压缩、并发、重试、取消）
│   ├── PageShell.tsx       四个子页面共用的外壳（顶栏 + 主题开关 + 空状态）
│   ├── ThemeProvider.tsx   主题上下文（localStorage + 防闪烁引导脚本）
│   ├── ThemeToggle.tsx     深浅切换按钮
│   ├── RouteMiniMap.tsx    路线可视化小地图
│   ├── CardGrid.tsx        卡片网格 + 拖拽排序
│   ├── MapView.tsx         2D 大地图
│   ├── home/               首屏专属（场景背景、液态光标、数字滚动）
│   ├── globe/              3D 地球模块
│   └── cover/              开场动画模块
├── lib/                    Supabase / DashScope / 地理编码 / 分组算法
└── types/                  全局类型
```

---

## 🎨 设计系统

整套配色基于 **CSS 变量令牌**，在 `globals.css` 中定义，通过 `<html class="dark">` 翻转，再用 Tailwind 4 的 `@theme inline` 注册为工具类。

| 令牌 | 工具类 | 用途 |
| --- | --- | --- |
| `--canvas` | `bg-canvas` | 页面底色 |
| `--surface` / `--surface-2` | `bg-surface` / `bg-surface-2` | 卡片 / 嵌套面板 |
| `--fg` / `--fg-2` / `--fg-3` | `text-fg` / `text-fg-2` / `text-fg-3` | 主 / 次 / 弱文字 |
| `--line` / `--line-2` | `border-line` / `border-line-2` | 描边 |
| `--brand` / `--brand-soft` | `text-brand` / `bg-brand-soft` | 品牌色（浅：青绿 / 深：青蓝） |
| `--gold` / `--gold-soft` | `text-gold` / `bg-gold-soft` | 等级徽章 |
| `--danger` / `--danger-soft` | `text-danger` / `bg-danger-soft` | 危险操作 |

**好处**：写 `bg-surface text-fg` 就自动适配深浅主题，不用到处写 `dark:` 变体。

**范围**：首屏 HERO 是恒深色的沉浸式设计（照片 + 暗色蒙版），不随主题翻转；四个子页面和主题开关覆盖的其余部分会跟随。切换按钮位于首页导航右上角及各子页面顶栏右侧。

**Leaflet 深色适配**：不依赖第三方暗色瓦片源（国内访问不稳定），改为在深色模式下对标准 OSM 瓦片做 CSS 反相（`.dark .themed-map .leaflet-tile-pane`）。

---

## 🐛 踩坑记录

### 1. 大图直传导致 AI 识别超时

**现象**：本地一切正常，线上某些截图死活识别不出来，换个时间又莫名其妙好了。

**真因**：前端压缩逻辑里有一句 `if (blob.size >= file.size) return file;` ——「压完反而更大就退回原图」。小红书截图多半已经是压过的 JPEG，重编码常常比原图还大，于是 3~8MB 的全分辨率原图被直传，base64 后再涨 33%，从海外 Serverless 节点打到阿里云 DashScope 必然撞上 45s 超时。

**修复**：改成阶梯降档 `1280px/0.82 → 1024px/0.75 → 800px/0.7`，压进 350KB 预算即止；**即使全部超预算，兜底也用压过的最小那份，绝不退回原图**。

实测（Vercel 美国节点 → DashScope）：

| 尺寸 / 体积 | 耗时 |
| --- | --- |
| 1170×2532 / 113KB | 8.7s |
| 1170×2532 / 169KB | 13.7s |
| 1170×2532 / 235KB | 27.8s |
| 1170×2532 / 626KB | **超时被掐断** |
| 739×1600 / 323KB | 9.7s |
| 591×1280 / 52KB | 5.3s |

**两层级超时必须配套**：代码层 45s（可用 `DASHSCOPE_TIMEOUT_MS` 覆盖）< 平台层 60s（`maxDuration`）。只改一层没用。

### 2. AI 失败被伪装成「上传成功」

`/api/classify` 早期只把 `work` 往外传，卡片入库就一律报成功。现在会返回完整响应（`ai_error` / `classification` / `ai_elapsed_ms`），前端如实区分三种结果：成功 / 已保存但没认出地点 / 彻底失败。

### 3. 平台超时返回 HTML 而不是 JSON

Vercel 504 时 `res.json()` 会抛 `Unexpected token 'A'`，前端只看到一句莫名其妙的报错。现在先判断 `content-type` 再解析，非 JSON 时给出「识别超时，请重试」这样人能看懂的提示。

### 4. 压缩后文件名丢失，重复检测失效

前端压缩后文件名变成 `upload-<时间戳>.jpg`，服务端按文件名查重的逻辑永远命中不了。现在把原始文件名通过 `originalName` 字段单独传给后端。

### 5. Leaflet 在静态预渲染阶段炸 `window is not defined`

**现象**：`pnpm build` 在 `Generating static pages` 卡在 `/routes`，报 `ReferenceError: window is not defined`。本地 `pnpm dev` 一切正常，因为只有构建期会做静态预渲染。

**真因**：`/routes` 页用了 Leaflet 小地图 `RouteMiniMap`，react-leaflet 在**模块顶层 import 阶段**就访问 `window`。哪怕页面标了 `"use client"`，Next.js 在静态预渲染时仍会执行模块顶层代码，于是炸在 build 而非运行时。

**修复**：`RouteMiniMap` 改用 `next/dynamic(() => import(...), { ssr: false })` 懒加载，让 Leaflet 只在浏览器里加载。所有用到 Three.js / Leaflet 且会被静态预渲染的组件（`GlobeView`、`RouteMiniMap`）都必须是 `ssr:false` 的动态导入。

**教训**：凡是 import 阶段碰 `window` / `document` 的第三方库（地图、3D、canvas），在会被静态预渲染的页面里一律 `next/dynamic({ ssr: false })`，别直接静态 import。

---

## 🗺️ 路线图

- ✅ v0.1 MVP：收藏与分类
- ✅ v0.2 丰富与管理：备注、搜索、状态标记
- ✅ v0.3 地图探索：2D 交互地图 + 路线规划与可视化
- ✅ v0.4 内容层：旅程记录、明信片、等级徽章
- ✅ v0.5 3D 地球 + 开场动画
- ✅ v0.6 设计系统：深浅双主题 + 四个子页面 UI 统一
- ✅ v0.7 批量上传（并发队列 + 逐张状态 + 失败重试）
- ⬜ v0.8 街道级缩放地图
- ⬜ v1.0 社交分享

---

## 💰 成本

个人用量下全部落在免费额度内：

| 资源 | 免费额度 |
| --- | --- |
| Vercel | 100GB 带宽 / Hobby |
| 腾讯 EdgeOne Pages | 基础免费额度 |
| Supabase | 500MB 数据库 + 1GB 存储 |
| DashScope | `qwen-vl-plus` / `qwen-plus` 免费额度 |

> Supabase 免费项目长时间无访问会自动暂停，在控制台点一下 Resume 即可恢复。
