# Spec: 街道级可缩放地图 (v0.3-street-map)

## 背景

当前地图使用 react-simple-maps (SVG 世界地图),缩放层级有限(最大国家级别),用户无法看到街道级细节。部署到 Vercel 后,浏览器直接加载地图瓦片不受沙箱网络封锁,可升级为街道级可缩放地图。

## 方案选型

Leaflet + OpenStreetMap 瓦片(免费,零密钥,街道级缩放)。

## 功能需求

### REQ-01: 地图引擎替换 (Ubiquitous)
The system shall 使用 Leaflet 替换 react-simple-maps 作为地图渲染引擎。

### REQ-02: 街道级缩放 (Ubiquitous)
The system shall 支持从世界视图(zoom ~2)到街道级别(zoom ~18)的连续缩放,用户可通过滚轮缩放、拖拽平移。

### REQ-03: 标记点渲染 (Ubiquitous)
The system shall 在每个已分类的地点坐标上渲染标记点,想去(蓝色)和去过(绿色)颜色区分,点大小随缩放级别调整以避免重叠。

### REQ-04: 标记点弹出信息 (Event-driven)
When 用户点击地图上的标记点,the system shall 显示弹出卡片,包含:景点名称、城市/国家、想去/去过状态、作品截图缩略图、备注。

### REQ-05: 标记点聚合 (Ubiquitous)
The system shall 在缩小视图时自动将密集区域的多个标记聚合为一个圆圈(含数字),放大后展开为独立标记,避免点过多互相覆盖。

### REQ-06: 初始视角定位 (Event-driven)
When 地图首次加载,the system shall 自动将视角定位到已有标记点的地理中心。若没有任何标记,默认显示中国区域。

### REQ-07: 向下兼容 (Ubiquitous)
The system shall 保留卡片视图全部现有功能不变,仅替换地图视图的实现。

## 技术要点

| 项 | 选择 |
|----|------|
| 地图库 | `react-leaflet` + `leaflet` |
| 瓦片源 | OpenStreetMap (免费) |
| 标记聚合 | `react-leaflet-markercluster` |
| 动态导入 | `dynamic(() => import(...), { ssr: false })` 确保只在客户端渲染 |
| CSS | leaflet 自带 + 自定义 marker 样式 |

## 涉及文件

| 文件 | 操作 |
|------|------|
| `src/components/MapView.tsx` | 重写: react-simple-maps → react-leaflet |
| `package.json` | 新增依赖: `leaflet`, `react-leaflet`, `react-leaflet-markercluster`, `@types/leaflet` |
| `src/app/page.tsx` | 无需改动(MapView 接口不变) |
| 删除 | `public/world-50m.json` (不再需要) |
| 删除 | `src/types/react-simple-maps.d.ts` (不再需要) |
| 删除 | `react-simple-maps` 依赖 |

## 验收标准

- [ ] 地图视图下可见 OSM 瓦片(街道/建筑/道路标注)
- [ ] 滚轮缩放:从世界视图平滑缩放到街道级别(能看到具体建筑轮廓)
- [ ] 标记点正确出现在对应坐标上
- [ ] 多个近距离标记在缩小视图时聚合,放大后展开
- [ ] 点击标记弹出景点信息卡片
- [ ] 卡片视图不受影响
- [ ] 暗色模式兼容
- [ ] 首次加载自动定位到标记中心
- [ ] Vercel 部署后地图正常加载(不依赖沙箱网络)
