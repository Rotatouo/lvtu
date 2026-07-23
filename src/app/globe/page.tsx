"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { mockWorks, mockRoutes } from "@/lib/mock-data";
import TimeController, { type TimeMode } from "@/components/globe/TimeController";

const GlobeView = dynamic(() => import("@/components/globe/GlobeView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
        <p className="text-sm text-white/40">加载 3D 地球…</p>
      </div>
    </div>
  ),
});

export default function GlobePage() {
  const [timeMode, setTimeMode] = useState<TimeMode>("auto");

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* 3D 地球 */}
      <GlobeView works={mockWorks} routes={mockRoutes} timeMode={timeMode} />

      {/* 顶部覆盖层 */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-4">
        <div>
          <h1 className="text-lg font-bold text-white/90 tracking-wide">旅途</h1>
          <p className="text-[11px] text-white/30 mt-0.5">3D 地球</p>
        </div>
        <TimeController mode={timeMode} onChange={setTimeMode} />
      </div>

      {/* 底部提示 */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
        <div className="rounded-full bg-white/5 px-4 py-1.5 backdrop-blur-md border border-white/8">
          <p className="text-[11px] text-white/40">
            拖动旋转 · 滚轮缩放 · 12 秒后自动慢速自转
          </p>
        </div>
      </div>
    </div>
  );
}
