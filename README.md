# 旅途 (Journey)

> 一座属于你的微型世界地图。把每一份心之所向变成清晰的远方。

**旅途** 是一款 AI 驱动的旅行灵感管理工具。上传社交媒体截图，AI 自动识别地点并分类整理，在交互式 3D 地球仪上标记你的旅行足迹。

[![Vercel](https://img.shields.io/badge/vercel-deployed-black)](https://lvtu-kueq.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)

---

## ✨ 功能

- 📤 **智能上传** — 拖拽社交媒体截图，AI 自动识别目的地、国家和城市
- 🌍 **3D 地球探索** — Three.js 驱动的地球仪，支持旋转缩放、标记工作地点和路线
- 🗺️ **世界地标浏览** — 5 个著名地点（World Map / Matterhorn / Trossachs / Li River / Jökulsárlón），点击切换背景
- 🎴 **封面页** — Atlas 风格暗色封面，带搜索、章节链接、交互式地标列表
- 📝 **旅行日记** — 为每个地点撰写游记（/journals）
- 🖼️ **明信片生成** — 将旅行地点生成为明信片样式（/postcards）
- 📊 **数据看板** — 旅行统计概览（/dashboard）
- 🗺️ **路线规划** — 创建和管理旅行路线（/routes）
- 🎯 **卡片视图 / 3D 地球视图** — 双重浏览模式
- ✨ **电影级动效** — Framer Motion 驱动的标题入场、数字滚动、卡片 hover、背景切换
- 🖱️ **极简光标** — 高性能圆环光标 + 柔和 bloom 效果
- ✨ **液态鼠标水纹** — Canvas + RAF 物理模拟涟漪（可选开关）

---

## 🛠️ 技术栈

| 层 | 技术 |
|---|---|
| **框架** | Next.js 16 (App Router) + React 19 |
| **语言** | TypeScript |
| **样式** | Tailwind CSS 4 + 自定义 CSS 变量 |
| **3D 渲染** | Three.js + @react-three/fiber + @react-three/drei |
| **动画** | Framer Motion |
| **数据库** | Supabase (PostgreSQL) |
| **AI** | Gemini 2.0 Flash (多模态识别) |
| **部署** | Vercel (自动 HTTPS + CDN) |
| **字体** | Playfair Display (衬线) + Noto Serif SC (中文衬线) + Plus Jakarta Sans (无衬线) |

---

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置 Supabase

1. 在 [supabase.com](https://supabase.com) 创建免费项目
2. 执行数据库迁移（见 `supabase-migration.sql`）
3. 在 Storage 中创建 `images` 存储桶（设为公开）
4. 复制项目 URL 和 anon key

### 3. 配置 Gemini API（可选，用于 AI 识别）

在 [Google AI Studio](https://aistudio.google.com/apikey) 获取 API Key。

> 如果不需要 AI 识别功能，系统支持 mock 数据兜底，仍可完整体验所有 UI 功能。

### 4. 环境变量

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIza...
```

### 5. 启动

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)

---

## 📂 项目结构

```
src/
├── app/                      # Next.js App Router 页面
│   ├── page.tsx              # 首页（Atlas 风格 hero + 4 面板工作流）
│   ├── layout.tsx            # 根布局（字体加载 + 全局样式）
│   ├── globals.css           # 全局样式 + Tailwind
│   ├── cover/                # 封面页（/cover）
│   ├── journals/             # 旅行日记（/journals）
│   ├── postcards/            # 明信片（/postcards）
│   ├── dashboard/            # 数据看板（/dashboard）
│   ├── routes/               # 路线管理（/routes）
│   ├── globe/                # 3D 地球独立页
│   └── api/                  # API 路由
│       ├── works/            # 作品 CRUD
│       ├── routes/           # 路线 CRUD
│       ├── journals/         # 日记 CRUD
│       ├── classify/         # AI 图片分类
│       ├── upload/           # 文件上传
│       ├── recommend/        # AI 推荐
│       ├��─ quotes/           # 旅行金句
│       └── weather/          # 天气查询
│
├── components/
│   ├── globe/                # 3D 地球组件
│   │   ├── GlobeView.tsx     # 3D 地球主渲染（Three.js Canvas）
│   │   ├── StarrySky.tsx     # 星空粒子背景
│   │   ├── GlobeMarkers.tsx  # 地点标记（beam + 数字 badge）
│   │   ├── RouteLines.tsx    # 路线连接线（CubicBezierCurve3）
│   │   ├── TimeController.tsx# 时间模式切换（auto/noon/night）
│   │   └── MarkerBeam.tsx    # 标记光束动画
│   │
│   ├── cover/                # 封面页组件
│   │   ├── CoverPage.tsx     # 封面主容器（世界地图 + 景点 + 章节）
│   │   ├── Scenes.tsx        # 4 个 SVG 电影级场景
│   │   ├── CoverGlobe.tsx    # 封面 3D 地球
│   │   └── EnterButton.tsx   # 进入动效按钮
│   │
│   ├── home/                 # 首页专属组件
│   │   ├── SceneBackgrounds.tsx  # 5 个地点真实照片背景 + SVG 兜底
│   │   ├── LiquidCursor.tsx  # 极简光标（圆环 + bloom）
│   │   └── CountUp.tsx       # 数字滚动动画（IntersectionObserver）
│   │
│   ├── UploadZone.tsx        # 拖拽/点击上传区域
│   ├── CardGrid.tsx          # 作品卡片网格（dnd-kit 拖拽排序）
│   ├── EditDrawer.tsx        # 作品编辑侧边抽屉
│   ├── ManualAddModal.tsx    # 手动添加弹窗
│   ├── ImageViewer.tsx       # 图片查看器
│   ├── JournalEditor.tsx     # 日记编辑器（富文本）
│   ├── UploadResultModal.tsx # 上传结果弹窗
│   └── EmptyState.tsx        # 空状态引导
│
├── lib/
│   ├── supabase.ts           # Supabase 客户端（含 service client）
│   ├── gemini.ts             # Gemini AI 多模态识别
│   ├── mock-data.ts          # Mock 数据（5 个作品 + 2 条路线）
│   └── grouping.ts           # 动态分组算法
│
└── types/
    └── index.ts              # TypeScript 类型定义（Work, Route, Journal 等）
```

---

## 📦 关键组件说明

### 3D 地球 (`GlobeView`)
- NASA Blue Marble 真实地球贴图（日/夜/法线/高光纹理）
- MeshPhongMaterial + emissive 自发光（确保地图形状始终可见）
- 三种光照模式：晨光 / 日间 / 黄昏 / 星辰
- OrbitControls 缩放旋转限制
- 12 秒自动旋转 + 鼠标拖拽
- 双层大气散射效果
- 1800 颗粒子星空 + 200 个大气尘埃

### 封面 + 首页（Atlas 美学）
- Apple/Lumora 风格暗色设计
- Playfair Display 衬线字体标题 + 渐变 italic 高亮
- Noto Serif SC 中文大标（letter-spacing 0.3em）
- 毛玻璃卡片（backdrop-blur + rgba 边框）
- Framer Motion 交错入场动画（标题逐句 + 统计 CountUp）
- 5 张著名地点卡片（60x60px 缩略图 + pop-out hover）

### 液态鼠标 (`LiquidCursor`)
- Canvas + requestAnimationFrame 物理模拟水纹涟漪
- 多环渲染（3 层递减环 + 中心水滴）
- 速度自适应强度
- 32px 细圆环光标 + 蓝色发光阴影

---

## 🌍 部署

### Vercel (推荐)

1. 在 [vercel.com](https://vercel.com) 导入 GitHub 仓库
2. 配置环境变量（同上）
3. 自动部署 — 每次 `git push` 自动触发

```bash
git push origin master
```

### 手动部署

```bash
pnpm build
pnpm start
```

---

## 💰 费用

| 资源 | 免费额度 | 预估 |
|---|---|---|
| Vercel | 100GB 带宽/月 | ¥0 |
| Supabase | 500MB DB + 1GB 存储 | ¥0 |
| Gemini 2.0 Flash | 1500次/天 | ¥0 |
| GitHub | 无限 public repo | ¥0 |

---

## 🏷️ 版本历史

| 版本 | 日期 | 内容 |
|---|---|---|
| v0.7.4 | 2026-07 | 世界地图与 cover 像素级统一、首页加章节链接、routes mock 兜底 |
| v0.7.2 | 2026-07 | 首页完全封面页化 + 8 项优化（删旅途、删中文副标、stats 大字、卡片放大 pop-out、章节链接） |
| v0.7.0 | 2026-07 | 封面页融合 v0.6.6-pre + v0.6.9（世界地图背景 + 标题 + 真实照片） |
| v0.6.9 | 2026-07 | 首页 v0.6.9：世界地图 + 真实照片 + 液态鼠标 + 5 著名地点 |
| v0.6.7 | 2026-07 | 首页 Atlas 风格化（3D 地球 hero + 4 面板工作流） |
| v0.6.6 | 2026-07 | SVG 电影级风景场景 + 三章节英文链接 + 底部弹层 |
| v0.6.4 | 2026-07 | 真地球纹理 + 封面页 Lumora 风格重设计 |
| v0.5 | 2026-07 | MVP 阶段交稿（AI 识别 + 路线管理 + 基础 UI） |

---

## 📄 License

MIT
