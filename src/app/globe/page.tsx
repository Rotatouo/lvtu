"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { mockWorks, mockRoutes } from "@/lib/mock-data";
import TimeController, { type TimeMode } from "@/components/globe/TimeController";

// Three.js 不能在服务端渲染，必须动态导入
const GlobeView = dynamic(() => import("@/components/globe/GlobeView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-white/40">
      加载 3D 地球…
    </div>
  ),
});

export default function GlobePage() {
  const [timeMode, setTimeMode] = useState<TimeMode>("auto");

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {/* 3D 地球占满全屏 */}
      <GlobeView works={mockWorks} routes={mockRoutes} timeMode={timeMode} />

      {/* 顶部覆盖层 */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <h1 className="text-xl font-bold text-white/90">旅途 · 3D 地球</h1>
        <TimeController mode={timeMode} onChange={setTimeMode} />
      </div>

      {/* 底部提示 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-xs text-white/40">
        拖动旋转 · 滚轮缩放 · 点击标点查看详情
      </div>
    </div>
  );
}
