# 旅途 v0.4 — 产品需求规格说明书 (PRD)

> **版本号**: v0.4.0 | **前序版本**: v0.3.0 (街道级地图)
>
> **版本目标**: 从"收藏夹"到"旅行记忆" — 路线规划、打卡日记、明信片、成就系统
>
> **撰写日期**: 2026-07-20 | **采用标准**: EARS 需求原则

---

## 一、背景与目标

### 1.1 现状 (v0.3)

"旅途"已具备:截图上传→AI自动分类(景点/城市/省份/国家)→卡片浏览+世界地图标记+想去/去过状态切换+暗色模式+搜索+多图上传。部署于 Vercel,数据库 Supabase,AI 引擎 DashScope qwen-vl-plus。

### 1.2 用户痛点

| 痛点 | 当前状态 | v0.4 解决方案 |
|------|---------|-------------|
| 心愿单只是收藏,无法规划出行顺序 | 一堆卡片/标记无关联 | 路线连线+拖拽排序 |
| "去过"只是绿色标记,无记忆留存 | 颜色变了就没了 | 旅行日记(简评+文艺句+日期) |
| 无法分享旅行记忆 | 只能截图 | 明信片生成导出图片 |
| 不知道景点实用信息(闭馆/预约) | 需要查百度 | 景点百科卡片 |
| 不知道目的地实时天气 | 没有 | 按需天气查询 |
| 会重复上传相同目的地 | 没有检测 | 重复检测+提示 |
| 没有新目的地灵感 | 自己找 | AI推荐相似目的地 |
| 没有成就感/留存动力 | 用完就走 | 成就系统+旅行看板(纯彩蛋) |

---

## 二、用户故事

- **作为旅行爱好者**,我想把"想去"的地点串成一条路线,直观看到行程方向。
- **作为记录者**,我想在去过一个地方后写下当时的感受,留下有日期的记忆。
- **作为分享者**,我想把我的旅行日记生成漂亮的明信片图片,发给朋友或发朋友圈。
- **作为收集者**,我想知道这个景点周一是否闭馆、是否需要预约,不想到门口才发现进不去。
- **作为旅行者**,我想在规划行程时点一下就能看到目的地的实时天气。
- **作为探索者**,我想让AI根据我的口味推荐新的目的地,也避免重复收藏同一个地方。
- **作为长期用户**,我想看到自己的旅行足迹统计,解锁称号和徽章,感受积累的成就感。

---

## 三、功能需求(EARS 格式)

---

### FEAT-01: 路线连线与拖拽排序

**REQ-01-1 (Ubiquitous)**
The system shall 在地图视图下,将所有 `status=want_to_go` 且 `lat/lng` 不为空的作品按 `sort_order` 升序排列后,用半透明折线(Polyline)依次连接。

**REQ-01-2 (Ubiquitous)**
The system shall 在路线连线的每个端点标注圆形序号(①②③...),序号位置略偏移以避免遮挡标记点。

**REQ-01-3 (State-driven)**
While 作品中 `want_to_go` 的数量 ≤ 1,the system shall 不渲染任何路线连线(一条线最少需要 2 个点)。

**REQ-01-4 (Event-driven)**
When 用户在卡片视图下拖拽卡片改变位置,the system shall 更新对应作品的 `sort_order`,触发地图路线同步刷新。

**REQ-01-5 (Ubiquitous)**
The system shall 在 `works` 表中新增 `sort_order INTEGER DEFAULT 0` 字段,新增的 `POST /api/works/reorder` 接口接受 `[{id, sort_order}]` 批量更新。

**REQ-01-6 (Unwanted)**
If 网络请求失败或排序更新失败,then the system shall 恢复拖拽前位置并在顶部显示 3 秒 toast 提示"排序失败,请重试"。

---

### FEAT-02: 旅行日记与打卡简评

**REQ-02-1 (Event-driven)**
When 用户点击"去过"按钮(或从卡片菜单选择"写日记"),the system shall 弹出日记编辑器,自动填入当前日期,显示 AI 生成中状态,3-5 秒后呈现 3 条文艺句候选项。

**REQ-02-2 (Ubiquitous)**
The system shall 调用 DashScope API 生成 3 条文艺句,Prompt 格式为:`"请为 [景点名],位于 [城市], [国家] 生成 3 条文艺风格的旅行感悟句子,每条 15-30 字,有文学感但不矫情,像是某位作家路过此地会写下的句子。返回 JSON 数组格式:["句子1","句子2","句子3"]。"`

**REQ-02-3 (Event-driven)**
When 用户从 3 条文艺句中选中 1 条,the system shall 将其填入日记编辑器的"文艺引语"栏,用户可继续编辑或删除。

**REQ-02-4 (Event-driven)**
When 用户写完简评并点击"保存",the system shall 将日记存入 `travel_journals` 表(id, work_id, content, quote, photo_url, created_at),同时将作品 `status` 更新为 `been_there`。

**REQ-02-5 (Ubiquitous)**
The system shall 提供日记列表页(路由 `/journals`),按 `created_at` 倒序展示所有日记,支持按国家/城市筛选。

**REQ-02-6 (Ubiquitous)**
The system shall 允许同一作品有多篇日记(用户多次拜访同一地点)。

**REQ-02-7 (Unwanted)**
If AI 生成文艺句失败(网络超时/API 错误),then the system shall 在文艺句区域显示"AI 暂时无法生成,请自行填写"并保留自由输入功能,不阻断日记保存流程。

**REQ-02-8 (Optional)**
Where 用户上传了现场照片,the system shall 将其存入 Supabase Storage `journals/` 路径,URL 存入 `travel_journals.photo_url`。

---

### FEAT-03: 明信片生成

**REQ-03-1 (Ubiquitous)**
The system shall 自动推荐值得做明信片的日记,推荐规则:日记有 `photo_url` 且 `content` 长度 ≥ 20 字。

**REQ-03-2 (Event-driven)**
When 用户进入明信片生成页面(路由 `/postcards`),the system shall 以网格展示推荐日记,用户勾选 1-6 篇。

**REQ-03-3 (Ubiquitous)**
The system shall 提供 3 种明信片模板:复古(米黄色底+衬线字体+边框)、清新(白色底+圆角阴影+淡色标题)、极简(黑白纯文字+照片满铺)。

**REQ-03-4 (Event-driven)**
When 用户选择模板后点击"生成",the system shall 使用 `html2canvas` 将 React 明信片组件渲染为 PNG,提供下载/分享。

**REQ-03-5 (Ubiquitous)**
每张明信片包含:景点名(标题)、打卡日期、用户简评、AI 文艺句(如有)、照片(如有)、城市/国家标签。

**REQ-03-6 (Unwanted)**
If 用户未选择任何日记,then the system shall 禁用"生成"按钮并显示提示"请至少选择 1 篇日记"。

---

### FEAT-04: 景点百科卡片

**REQ-04-1 (Ubiquitous)**
The system shall 在 AI 分类 prompt 中新增 `opening_note` 字段,指示 AI 提取关键差异信息(闭馆日、预约要求、收费情况、联系电话),无特殊信息时返回 null。

**REQ-04-2 (Ubiquitous)**
The system shall 在 `works` 表中新增 `opening_note TEXT` 字段存储百科备注。

**REQ-04-3 (State-driven)**
While `opening_note` 不为空,the system shall 在卡片视图和地图弹层中,景点名下方以灰色小字显示备注信息。

**REQ-04-4 (State-driven)**
While `opening_note` 为空,the system shall 不显示任何备注区域(不占空间)。

**REQ-04-5 (Unwanted)**
If AI 返回的 `opening_note` 超过 100 字,then the system shall 截断为 100 字并附加"..."。

---

### FEAT-05: 天气查询(按需)

**REQ-05-1 (Event-driven)**
When 用户点击地图标记弹出卡片中的"查看天气 🌤️"按钮,the system shall 调用 Open-Meteo API `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,weather_code,wind_speed_10m`,展示实时温度、天气图标、风速。

**REQ-05-2 (Ubiquitous)**
The system shall 对同坐标的天气查询结果缓存 30 分钟(内存缓存),相同坐标在此期间不重复请求 Open-Meteo。

**REQ-05-3 (State-driven)**
While 天气数据加载中,the system shall 显示骨架屏/加载动画。

**REQ-05-4 (Unwanted)**
If Open-Meteo 请求失败或超时(>10s),then the system shall 显示"天气数据暂不可用"并保留按钮供用户重试。

**REQ-05-5 (Ubiquitous)**
The system shall 通过 `GET /api/weather?lat=xx&lng=xx` 代理请求(服务端调用 Open-Meteo,前端不直接暴露)。

---

### FEAT-06: AI 推荐与重复检测

**REQ-06-1 (Event-driven)**
When 用户上传新作品,the system shall 检查 `image_url` 的路径是否已存在于 `works` 表。若存在,弹出"已收录此目的地,是否仍要添加?"对话框,用户可选择"仍要添加"或"取消"。

**REQ-06-2 (Ubiquitous)**
The system shall 在旅行看板页面底部展示 AI 推荐模块:调用 DashScope,Prompt 为 `"基于以下已收藏的旅行目的地列表:[地点1/地点2...],请推荐 3 个相似的目的地,每个附带一句话推荐理由。返回 JSON [{name, reason}]"`。

**REQ-06-3 (Ubiquitous)**
The system shall 缓存推荐结果 24 小时(内存),避免每次打开看板都重新调用 AI。

**REQ-06-4 (Event-driven)**
When 用户点击推荐卡片上的"+ 添加到心愿单",the system shall 创建新作品(manual add 模式),ai_attraction=推荐地名,状态为 want_to_go,is_confirmed=false。

**REQ-06-5 (Unwanted)**
If 用户作品中尚无任何已确认的目的地,then the system shall 在推荐区域显示"添加更多目的地后,AI 会为你推荐相似的去处"。

---

### FEAT-07: 成就系统与旅行看板

**REQ-07-1 (Ubiquitous)**
The system shall 提供旅行看板独立页面(路由 `/dashboard`),包含:成就概览(等级+称号+经验进度条)、数据统计卡片、徽章收集墙、AI 推荐模块。

**REQ-07-2 (Ubiquitous)**
The system shall 使用以下经验值计算规则(纯前端计算,不写入数据库):

| 行为 | 经验 | 触发条件 |
|------|------|---------|
| 添加一个心愿 | +10 | 作品创建时 |
| AI 识别成功 | +15 | classify API 返回 confidence ≥ medium |
| 完成一篇日记 | +30 | 日记保存时 |
| 标记"去过" | +25 | status 切换为 been_there |

**REQ-07-3 (Ubiquitous)**
The system shall 使用以下 10 级称号体系:

| 等级 | 经验需求 | 称号 |
|------|---------|------|
| 1 | 0 | 初涉旅途 |
| 2 | 50 | 行路旅人 |
| 3 | 120 | 山海行者 |
| 4 | 220 | 远行客 |
| 5 | 360 | 天涯旅人 |
| 6 | 550 | 万里行舟 |
| 7 | 800 | 星海旅者 |
| 8 | 1100 | 光阴旅人 |
| 9 | 1500 | 天地行者 |
| 10 | 2000 | 无尽旅途 |

**REQ-07-4 (Ubiquitous)**
The system shall 在数据统计卡片中展示:去过 X 个国家、Y 个城市、Z 个景点、累计 N 篇日记。

**REQ-07-5 (Ubiquitous)**
The system shall 提供徽章收集墙,包含至少 5 枚徽章:跨洲旅行(≥2 洲)、博物馆爱好者(≥5 个博物馆类)、四季旅行者(4 个不同月份去过)、日记达人(≥10 篇)、心愿满溢(≥20 个心愿)。

**REQ-07-6 (Ubiquitous)**
The system shall **不因成就等级限制任何功能**。所有功能(天气、明信片、日记等)开箱即用,成就系统纯为彩蛋与统计展示。

**REQ-07-7 (Unwanted)**
If 用户作品中尚无数据(0 个作品),then the system shall 在看板页面展示空状态引导:"上传你的第一张旅行截图,开始你的旅程吧!"

---

## 四、流程说明

### 4.1 旅行日记完整流程

```
用户点击"去过"
    │
    ▼
弹出日记编辑器 ── 自动填入日期
    │
    ├── AI 生成中(3-5秒旋转动画)
    │      │
    │      ├── 成功 → 展示 3 条文艺句
    │      │          用户选 1 条(可编辑/删除)
    │      │
    │      └── 失败 → "AI 暂时无法生成,请自行填写"(不阻断)
    │
    ├── 自由输入简评
    ├── 可选上传现场照片
    │
    ▼
用户点"保存"
    │
    ├── 日记 → travel_journals 表
    ├── status → been_there
    └── 卡片颜色从蓝色变为绿色
```

### 4.2 明信片生成流程

```
用户进入 /postcards
    │
    ▼
系统自动筛选:有照片 + 简评 ≥ 20 字
    │
    ├── 有结果 → 网格展示推荐日记
    │               用户勾选(1-6篇)
    │
    └── 无结果 → 空状态提示"先写几篇日记再来制作明信片吧"
    │
    ▼
用户选模板(复古/清新/极简)
    │
    ▼
点击"生成" → html2canvas 渲染 → PNG 下载
```

---

## 五、交互说明

### 5.1 拖拽排序
- 触发:卡片长按(移动端) / 鼠标按住拖拽(PC)
- 视觉:拖拽中的卡片浮起(阴影+缩放 1.02)
- 松手:卡片插入新位置,地图路线同步刷新

### 5.2 天气查询
- 按钮位置:地图标记弹出层底部,在"查看详情 →"上方
- 加载态:按钮变为旋转图标+文字"查询中..."
- 结果展示:在弹出层内部展开,显示温度+天气图标+风速
- 缓存提示:不显示(用户无感知)

### 5.3 旅行看板
- 顶部:等级称号居中,大号字体,经验进度条为渐变色
- 中部:4 格数据卡片(国家/城市/景点/日记),每格有图标+数字
- 下部:徽章墙网格,未获得为灰色半透明,获得后彩色亮起+弹跳动画
- 底部:AI 推荐模块(3 张横向滑动卡片)

---

## 六、数据模型变更

### 6.1 works 表新增字段

```sql
ALTER TABLE works ADD COLUMN sort_order INTEGER DEFAULT 0;
ALTER TABLE works ADD COLUMN opening_note TEXT;
```

### 6.2 新建 travel_journals 表

```sql
CREATE TABLE travel_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  quote TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_journals_work_id ON travel_journals(work_id);
CREATE INDEX idx_journals_created_at ON travel_journals(created_at DESC);
```

### 6.3 新建 API 路由

| 方法 | 路由 | 说明 |
|------|------|------|
| `POST` | `/api/works/reorder` | 批量更新 sort_order |
| `POST` | `/api/journals` | 创建日记 |
| `GET` | `/api/journals` | 获取日记列表(?work_id=&country=&city=) |
| `DELETE` | `/api/journals/[id]` | 删除日记 |
| `POST` | `/api/quotes` | 生成文艺句 |
| `GET` | `/api/weather` | 天气代理(?lat=&lng=) |
| `GET` | `/api/recommend` | AI 推荐目的地 |

---

## 七、界面清单

| 页面/组件 | 路由 | 说明 |
|-----------|------|------|
| 旅行日记列表 | `/journals` | 日记浏览/筛选 |
| 明信片生成 | `/postcards` | 选择日记→模板→生成 |
| 旅行看板 | `/dashboard` | 成就+统计+徽章+推荐 |
| 日记编辑器(弹窗) | 主页内弹出 | 已在 page.tsx 中 |
| 天气展示(内嵌) | 地图弹层内 | 已在 MapView 中 |
| 重复检测弹窗 | 主页内弹出 | 上传时触发 |

---

## 八、技术依赖

| 依赖 | 用途 | 许可证/费用 |
|------|------|-----------|
| `react-beautiful-dnd` 或 `@dnd-kit/core` | 卡片拖拽排序 | MIT 免费 |
| `html2canvas` | 明信片截图 | MIT 免费 |
| Open-Meteo API | 天气数据 | 完全免费无密钥 |
| DashScope qwen-vl-plus | 文艺句生成/AI推荐(已有) | 免费额度 |
| Leaflet Polyline | 路线连线(已有) | 免费 |

---

## 九、验收标准总览

### M1 路线连线+拖拽
- [ ] 2+个"想去"点在地图上连成线,有序号
- [ ] 拖拽卡片后地图路线同步刷新
- [ ] 排序失败时 toast 提示

### M2 旅行日记
- [ ] "去过"弹出日记编辑器
- [ ] AI 生成 3 条文艺句,可选可用
- [ ] 保存后日记列表可查看/筛选
- [ ] AI 失败不阻断保存

### M3 明信片
- [ ] 自动推荐合格日记
- [ ] 选择 1-6 篇,3 种模板可切换
- [ ] 生成 PNG 包含所有信息

### M4 百科卡片
- [ ] AI 正确提取闭馆/预约等信息
- [ ] 卡片/弹层显示备注(有则显示,无则不占空间)

### M5 天气
- [ ] 点击查询显示温度+天气+风速
- [ ] 同坐标 30 分钟缓存
- [ ] 失败提示+可重试

### M6 AI增强
- [ ] 重复图片弹窗提示
- [ ] 看板底部推荐 3 个目的地
- [ ] 点击推荐可一键添加

### M7 成就看板
- [ ] 等级/称号/经验正确计算
- [ ] 数据统计数字准确
- [ ] 徽章获得/未获得状态正确
- [ ] 无任何功能被锁定
- [ ] 0 数据时空状态引导
