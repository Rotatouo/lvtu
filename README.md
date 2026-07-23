# 旅途 (Journey)

上传社交媒体旅行截图，AI 自动分类整理，打造你的全球旅行心愿单。

## 技术栈

- **框架**: Next.js 14 + React
- **样式**: Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **图片存储**: Supabase Storage
- **AI**: Gemini 2.0 Flash (多模态识别)
- **部署**: Vercel

## 快速开始

### 1. 环境准备

```bash
# 安装依赖
pnpm install
```

### 2. 配置 Supabase

1. 在 [supabase.com](https://supabase.com) 创建免费项目
2. 在 SQL Editor 中执行 `supabase-migration.sql`
3. 在 Storage 中创建 `images` 存储桶（设为公开）
4. 复制项目 URL 和 anon key

### 3. 配置 Gemini API

1. 在 [Google AI Studio](https://aistudio.google.com/apikey) 获取 API Key
2. Gemini 2.0 Flash 每天有 1500 次免费调用额度

### 4. 环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local` 填入实际值：

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIza...
```

### 5. 启动开发

```bash
pnpm dev
```

打开 http://localhost:3000

### 6. 部署到 Vercel

```bash
# 安装 Vercel CLI
pnpm add -g vercel

# 部署
vercel

# 在 Vercel Dashboard 中配置环境变量
```

或直接在 [vercel.com](https://vercel.com) 导入 GitHub 仓库，自动部署。

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── classify/    # POST - 上传截图 + AI 分类
│   │   └── works/       # GET/POST/PUT/DELETE - 作品 CRUD
│   ├── layout.tsx       # 根布局
│   ├── page.tsx         # 首页
│   └── globals.css      # 全局样式
├── components/
│   ├── UploadZone.tsx   # 拖拽上传组件
│   ├── WorkCard.tsx     # 作品卡片
│   ├── CardGrid.tsx     # 动态分组网格
│   ├── EditDrawer.tsx   # 分类编辑抽屉
│   ├── ManualAddModal.tsx # 手动添加弹窗
│   ├── ImageViewer.tsx  # 图片查看器
│   └── EmptyState.tsx   # 空状态引导
├── lib/
│   ├── supabase.ts      # Supabase 客户端
│   ├── gemini.ts        # Gemini AI 客户端
│   └── grouping.ts      # 动态分组算法
└── types/
    └── index.ts         # TypeScript 类型定义
```

## 费用

| 资源 | 免费额度 | 预估月费 |
|------|---------|---------|
| Vercel | 100GB 带宽 | ¥0 |
| Supabase | 500MB 数据库 + 1GB 存储 | ¥0 |
| Gemini 2.0 Flash | 1500次/天 | ¥0 |
| **合计** | | **¥0** |

## 里程碑

- ✅ v0.1 - MVP: 收藏与分类
- ⬜ v0.2 - 丰富与管理（备注、搜索、状态标记）
- ⬜ v0.3 - 地图探索（2D 交互地图 + 路线规划）
- ⬜ v1.0 - 3D 地球仪 + 社交分享
