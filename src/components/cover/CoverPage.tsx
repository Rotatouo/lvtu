"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { mockWorks } from "@/lib/mock-data";

const GlobeView = dynamic(() => import("@/components/globe/GlobeView"), {
  ssr: false,
  loading: () => null,
});

// ─────── 背景场景（点击右侧地点切换） ───────
const SCENES = {
  world: {
    label: "World Map",
    type: "image" as const,
    src: "/textures/earth-day.jpg",
    gradient: "",
  },
  iceland: {
    label: "Northern Lights",
    type: "gradient" as const,
    background:
      "linear-gradient(170deg, #050b18 0%, #0a1f1a 25%, #0d4a25 50%, #1a3a5c 78%, #0a1224 100%)",
    accent: "rgba(34, 211, 167, 0.4)", // aurora green
  },
  tokyo: {
    label: "Tokyo Nights",
    type: "gradient" as const,
    background:
      "linear-gradient(165deg, #06081a 0%, #16114a 35%, #52155a 70%, #83206a 90%, #1e1238 100%)",
    accent: "rgba(236, 72, 153, 0.35)", // neon pink
  },
  santorini: {
    label: "Santorini Sunset",
    type: "gradient" as const,
    background:
      "linear-gradient(160deg, #0c2440 0%, #256387 30%, #f2994a 65%, #f8c977 85%, #6a3a23 100%)",
    accent: "rgba(251, 191, 36, 0.4)", // amber
  },
  alps: {
    label: "Golden Alps",
    type: "gradient" as const,
    background:
      "linear-gradient(155deg, #1a1a2e 0%, #2c3370 20%, #6b3685 45%, #d97e3b 75%, #b8421e 100%)",
    accent: "rgba(245, 158, 11, 0.4)", // amber
  },
};

// 著名地点（用于右侧卡片 + 底部陈列）
const destinations = [
  { id: "iceland", name: "Golden Alps", subtitle: "Matterhorn · Switzerland" },
  { id: "alps", name: "Golden Alps", subtitle: "Matterhorn · Switzerland" },
  { id: "tokyo", name: "Tokyo Nights", subtitle: "Shibuya · Japan" },
  { id: "santorini", name: "Santorini Sunset", subtitle: "Cyclades · Greece" },
];

// SVG 风景装饰（每场景不同的剪影）
function SceneSilhouette({ sceneId }: { sceneId: string }) {
  if (sceneId === "world") return null;
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Aurora 效果 / 城市灯 / 山影 */}
      {sceneId === "iceland" && (
        <>
          {/* 极光波纹 */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: "20%",
              height: "40%",
              background:
                "linear-gradient(180deg, rgba(34,211,167,0.0) 0%, rgba(34,211,167,0.25) 35%, rgba(74,222,128,0.4) 50%, rgba(34,211,167,0.2) 70%, transparent 100%)",
              filter: "blur(40px)",
              transform: "rotate(-3deg)",
            }}
          />
          {/* 山影 */}
          <svg
            className="absolute bottom-0 left-0 right-0 w-full"
            viewBox="0 0 1200 250"
            preserveAspectRatio="none"
            style={{ height: "35vh" }}
          >
            <polygon
              points="0,250 0,140 80,80 160,120 240,40 320,90 400,30 480,110 560,60 640,100 720,50 800,90 880,40 960,80 1040,60 1120,90 1200,70 1200,250"
              fill="rgba(0,0,0,0.55)"
            />
            <polygon
              points="0,250 0,180 100,140 220,170 340,130 460,170 580,140 700,170 820,130 940,170 1060,140 1200,170 1200,250"
              fill="rgba(0,0,0,0.35)"
            />
          </svg>
        </>
      )}
      {sceneId === "tokyo" && (
        <>
          {/* 霓虹光晕 */}
          <div
            className="absolute right-1/4 top-1/3 w-1/2 h-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(236,72,153,0.4) 0%, transparent 60%)",
              filter: "blur(60px)",
            }}
          />
          {/* 城市天际线 */}
          <svg
            className="absolute bottom-0 left-0 right-0 w-full"
            viewBox="0 0 1200 250"
            preserveAspectRatio="none"
            style={{ height: "40vh" }}
          >
            <polygon
              points="0,250 0,200 60,160 100,180 100,80 140,80 140,140 180,140 180,200 240,200 240,120 280,120 280,180 320,180 320,60 360,60 360,140 400,140 400,100 440,100 440,170 480,170 480,40 520,40 520,130 560,130 560,90 600,90 600,150 640,150 640,70 680,70 680,120 720,120 720,50 760,50 760,110 800,110 800,80 840,80 840,150 880,150 880,100 920,100 920,160 960,160 960,60 1000,60 1000,130 1040,130 1040,90 1080,90 1080,170 1120,170 1120,100 1160,100 1160,180 1200,180 1200,250"
              fill="rgba(0,0,0,0.6)"
            />
            <polygon
              points="0,250 0,210 80,200 160,220 240,200 320,210 400,190 480,210 560,200 640,220 720,200 800,210 880,190 960,210 1040,200 1120,220 1200,200 1200,250"
              fill="rgba(0,0,0,0.3)"
            />
          </svg>
        </>
      )}
      {sceneId === "santorini" && (
        <>
          {/* 阳光光晕 */}
          <div
            className="absolute right-1/3 top-1/4 w-1/3 h-1/3 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(251,191,36,0.5) 0%, transparent 70%)",
              filter: "blur(50px)",
            }}
          />
          {/* 海面 + 白色穹顶 */}
          <svg
            className="absolute bottom-0 left-0 right-0 w-full"
            viewBox="0 0 1200 250"
            preserveAspectRatio="none"
            style={{ height: "35vh" }}
          >
            {/* 海水 */}
            <rect x="0" y="180" width="1200" height="70" fill="rgba(20,40,70,0.5)" />
            {/* 白色穹顶剪影 */}
            <ellipse cx="200" cy="180" rx="40" ry="35" fill="rgba(255,255,255,0.4)" />
            <rect x="160" y="180" width="80" height="50" fill="rgba(255,255,255,0.35)" />
            <ellipse cx="500" cy="170" rx="50" ry="40" fill="rgba(255,255,255,0.45)" />
            <rect x="450" y="170" width="100" height="60" fill="rgba(255,255,255,0.4)" />
            <ellipse cx="850" cy="175" rx="45" ry="38" fill="rgba(255,255,255,0.4)" />
            <rect x="805" y="175" width="90" height="55" fill="rgba(255,255,255,0.35)" />
            {/* 远处小岛 */}
            <ellipse cx="1050" cy="195" rx="60" ry="12" fill="rgba(255,255,255,0.2)" />
          </svg>
        </>
      )}
      {sceneId === "alps" && (
        <>
          {/* 落日光晕 */}
          <div
            className="absolute left-1/2 top-1/4 w-1/2 h-1/3 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          {/* 山影 */}
          <svg
            className="absolute bottom-0 left-0 right-0 w-full"
            viewBox="0 0 1200 300"
            preserveAspectRatio="none"
            style={{ height: "45vh" }}
          >
            <polygon
              points="0,300 0,180 80,140 160,100 240,60 320,120 400,40 480,100 560,80 640,40 720,100 800,60 880,120 960,80 1040,40 1120,100 1200,140 1200,300"
              fill="rgba(0,0,0,0.55)"
            />
            <polygon
              points="0,300 0,220 100,200 200,180 300,210 400,190 500,220 600,180 700,200 800,180 900,210 1000,190 1100,200 1200,180 1200,300"
              fill="rgba(0,0,0,0.35)"
            />
            {/* 金色阳光反射 */}
            <ellipse cx="600" cy="240" rx="200" ry="6" fill="rgba(245,158,11,0.25)" />
          </svg>
        </>
      )}
    </div>
  );
}

function getStats() {
  const been = mockWorks.filter((w) => w.status === "been_there");
  const countries = new Set(been.map((w) => w.final_country).filter(Boolean));
  const cities = new Set(been.map((w) => w.final_city).filter(Boolean));
  const spots = new Set(been.map((w) => w.final_attraction).filter(Boolean));
  return { countries: countries.size, cities: cities.size, spots: spots.size };
}

export default function CoverPage() {
  const [stats, setStats] = useState({ countries: 0, cities: 0, spots: 0 });
  const [activeScene, setActiveScene] = useState<keyof typeof SCENES>("world");

  useEffect(() => {
    setStats(getStats());
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* ─────── 背景层（带过渡） ─────── */}
      <div className="absolute inset-0">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeScene}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
            style={
              SCENES[activeScene].type === "image"
                ? {
                    backgroundImage: `url(${SCENES[activeScene].src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : { background: SCENES[activeScene].background }
            }
          >
            {activeScene !== "world" && <SceneSilhouette sceneId={activeScene} />}
          </motion.div>
        </AnimatePresence>

        {/* 左侧文字加深遮罩 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(6,8,13,0.95) 0%, rgba(6,8,13,0.75) 35%, rgba(6,8,13,0.25) 65%, rgba(6,8,13,0.05) 100%)",
          }}
        />
        {/* 全局氛围光 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 25% 35%, rgba(60,100,160,0.15) 0%, transparent 55%), radial-gradient(ellipse at 85% 75%, rgba(120,70,160,0.10) 0%, transparent 60%)",
          }}
        />
        {/* 微星空（仅在地球默认场景下） */}
        {activeScene === "world" && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: Math.random() * 1.3 + 0.3 + "px",
                  height: Math.random() * 1.3 + 0.3 + "px",
                  top: Math.random() * 100 + "%",
                  left: Math.random() * 100 + "%",
                  opacity: 0.15 + Math.random() * 0.4,
                  animation: `twinkle ${3 + Math.random() * 4}s ease-in-out ${
                    Math.random() * 3
                  }s infinite alternate`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─────── 顶部 nav（中文 plain text，无 handler） ─────── */}
      <motion.nav
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-10 py-6"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="h-6 w-6 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, #ffffff, #6a8caf 60%, #1a2a45)",
              boxShadow: "0 0 10px rgba(150,180,220,0.4)",
            }}
          />
          <span className="text-white/90 text-sm tracking-[0.3em] uppercase font-medium">
            旅途
          </span>
        </div>

        {/* 中央中文导航（plain text，无 handler，无玻璃胶囊） */}
        <div className="flex items-center gap-8">
          {["世界地图", "旅程记录", "探索灵感", "关于"].map((t) => (
            <a
              key={t}
              className="relative text-white/70 hover:text-white/95 text-sm cursor-pointer transition-colors duration-200 group"
            >
              {t}
              <span
                className="absolute -bottom-1 left-0 h-px bg-white/60 transition-all duration-300 w-0 group-hover:w-full"
              />
            </a>
          ))}
        </div>

        {/* 右侧：登录按钮（保留玻璃药丸样式，与导航区分） */}
        <button className="px-5 py-2 rounded-full bg-white/8 hover:bg-white/12 backdrop-blur-md border border-white/10 text-white/85 text-sm transition-all">
          登录
        </button>
      </motion.nav>

      {/* ─────── 主内容 ─────── */}
      <div className="relative z-10 h-full flex flex-col justify-center px-10 md:px-20 max-w-[55%]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="text-[10px] tracking-[0.5em] uppercase text-white/40 mb-5">
            A WORLD OF YOUR OWN
          </div>

          <h1
            className="text-7xl md:text-8xl lg:text-[7rem] font-light text-white leading-[0.95] mb-5"
            style={{
              fontFamily: '"Playfair Display", "Noto Serif SC", Georgia, serif',
              letterSpacing: "-0.03em",
            }}
          >
            A Journey
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #d8e4f5 0%, #7da3d0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontStyle: "italic",
              }}
            >
              Begins Within
            </span>
            <span className="text-white/30 text-4xl md:text-5xl align-top ml-2">.</span>
          </h1>

          <div
            className="text-3xl md:text-4xl mb-7"
            style={{
              fontFamily: '"Noto Serif SC", serif',
              fontWeight: 300,
              letterSpacing: "0.3em",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            旅途
          </div>

          <p className="text-white/45 text-sm md:text-base leading-relaxed tracking-wider max-w-md mb-12">
            一座属于你的微型世界地图。
            <br />
            把每一份心之所向变成清晰的远方。
          </p>

          {/* 输入框（去掉 📍，无 handler） */}
          <div className="flex items-center gap-3 max-w-md mb-10">
            <div
              className="flex-1 rounded-full px-6 py-3.5 flex items-center gap-3"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <input
                type="text"
                placeholder="下一站想去哪里？"
                className="bg-transparent outline-none text-white/85 text-sm flex-1 placeholder:text-white/30"
              />
              <button
                className="px-5 py-2 rounded-full text-sm text-white font-medium transition-all hover:scale-105 cursor-not-allowed opacity-60"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  color: "#0a1424",
                }}
              >
                开始
              </button>
            </div>
          </div>

          {/* 底部：著名地点直接陈列（替换原三个章节链接） */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="space-y-3"
          >
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/30">
              STORIES CURATED
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              {destinations.map((d, i) => (
                <span
                  key={d.id + d.name}
                  className="flex items-center gap-2 group"
                >
                  <span
                    className="h-1 w-1 rounded-full bg-white/30 group-hover:bg-white/60 transition-colors"
                  />
                  <span className="text-white/55 group-hover:text-white/85 transition-colors cursor-default">
                    {d.name}
                  </span>
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ─────── 右上统计卡 ─────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.6 }}
        className="absolute top-28 right-10 z-20 hidden lg:block"
      >
        <div
          className="rounded-2xl px-6 py-5 backdrop-blur-xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="text-[10px] text-white/40 tracking-[0.3em] uppercase mb-3">
            JOURNEY SO FAR
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className="text-4xl font-light text-white/95"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              {stats.countries}
            </span>
            <span className="text-xs text-white/50">countries</span>
          </div>
          <div className="text-[11px] text-white/50">
            {stats.cities} 城市 · {stats.spots} 景点
          </div>
        </div>
      </motion.div>

      {/* ─────── 右侧著名地点探索列表（点击 → 切换背景） ─────── */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1.4 }}
        className="absolute right-8 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-2 max-w-[20rem] pointer-events-none"
      >
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/35 mb-2 pointer-events-auto">
          FEATURED LANDMARKS
        </div>

        {/* 五个：世界地图 + 4 个著名地点 */}
        {(["world", ...Object.keys(SCENES).slice(1)] as Array<keyof typeof SCENES>).map(
          (sceneId) => {
            const scene = SCENES[sceneId];
            const isActive = activeScene === sceneId;
            return (
              <button
                key={sceneId}
                onClick={() => setActiveScene(sceneId)}
                className="group flex items-center gap-3 p-3 rounded-xl text-left pointer-events-auto transition-all"
                style={{
                  background: isActive
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(255,255,255,0.025)",
                  border: isActive
                    ? "1px solid rgba(255,255,255,0.15)"
                    : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {/* 小缩略图 */}
                <div
                  className="w-10 h-10 rounded-lg shrink-0 relative overflow-hidden"
                  style={{
                    background:
                      scene.type === "image"
                        ? `url(${scene.src}) center/cover`
                        : scene.background,
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 60%)",
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm truncate transition-colors ${
                      isActive ? "text-white" : "text-white/85 group-hover:text-white"
                    }`}
                  >
                    {scene.label}
                  </div>
                  <div className="text-[10px] text-white/40 truncate mt-0.5">
                    {sceneId === "world"
                      ? "Real-time NASA imagery"
                      : sceneId === "iceland"
                        ? "Reykjavík · Iceland"
                        : sceneId === "alps"
                          ? "Matterhorn · Switzerland"
                          : sceneId === "tokyo"
                            ? "Shibuya · Japan"
                            : "Cyclades · Greece"}
                  </div>
                </div>

                {isActive ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ) : (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-white/30 group-hover:text-white/70 transition-colors shrink-0"
                  >
                    <path
                      d="M9 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          }
        )}
      </motion.div>

      {/* ─────── 底部 footer ─────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.6 }}
        className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-12 text-[10px] tracking-[0.3em] uppercase text-white/30"
      >
        <span>3D Interactive Globe</span>
        <span className="text-white/15">·</span>
        <span>AI Powered Stories</span>
        <span className="text-white/15">·</span>
        <span>Personal Universe</span>
      </motion.div>

      <style jsx global>{`
        @keyframes twinkle {
          from {
            opacity: 0.1;
          }
          to {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
