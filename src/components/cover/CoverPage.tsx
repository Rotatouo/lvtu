"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import CoverGlobe from "./CoverGlobe";
import EnterButton from "./EnterButton";
import { mockWorks } from "@/lib/mock-data";

const GlobeView = dynamic(() => import("@/components/globe/GlobeView"), {
  ssr: false,
  loading: () => null,
});

type SceneType = "dream" | "memory" | "journey" | null;

function getStats() {
  const been = mockWorks.filter((w) => w.status === "been_there");
  const countries = new Set(been.map((w) => w.final_country).filter(Boolean));
  const cities = new Set(been.map((w) => w.final_city).filter(Boolean));
  const spots = new Set(been.map((w) => w.final_attraction).filter(Boolean));
  return { countries: countries.size, cities: cities.size, spots: spots.size };
}

// 顶部导航
function TopNav() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-8 py-5"
    >
      <div className="flex items-center gap-2">
        <div
          className="h-7 w-7 rounded-full"
          style={{
            background: "radial-gradient(circle at 30% 30%, #ffffff, #6a8caf 60%, #1a2a45)",
            boxShadow: "0 0 12px rgba(150,180,220,0.4)",
          }}
        />
        <span className="text-white/90 text-sm tracking-[0.3em] uppercase">旅途</span>
      </div>

      <div className="hidden md:flex items-center gap-8 px-6 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/8">
        <a className="text-white/60 hover:text-white/90 text-sm cursor-pointer transition-colors">世界地图</a>
        <a className="text-white/60 hover:text-white/90 text-sm cursor-pointer transition-colors">旅程记录</a>
        <a className="text-white/60 hover:text-white/90 text-sm cursor-pointer transition-colors">探索灵感</a>
        <a className="text-white/60 hover:text-white/90 text-sm cursor-pointer transition-colors">关于</a>
      </div>

      <div className="flex items-center gap-3">
        <button className="px-4 py-1.5 rounded-full bg-white/8 backdrop-blur-md border border-white/10 text-white/80 text-sm">
          登录
        </button>
      </div>
    </motion.nav>
  );
}

// 玻璃统计卡片
function StatsCard({ stats }: { stats: { countries: number; cities: number; spots: number } }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.0 }}
      className="absolute right-8 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-3"
    >
      <div
        className="rounded-2xl px-5 py-4 backdrop-blur-xl"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="text-[11px] text-white/40 tracking-widest uppercase mb-1">已经走过</div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-light text-white/90">{stats.countries}</span>
          <span className="text-xs text-white/50">个国家</span>
        </div>
        <div className="mt-2 text-[11px] text-white/50">
          {stats.cities} 城市 · {stats.spots} 个景点
        </div>
      </div>
    </motion.div>
  );
}

// 三个叙事文本触发器
function StoryTriggers({ onSelect }: { onSelect: (s: SceneType) => void }) {
  const items: { key: Exclude<SceneType, null>; title: string; sub: string }[] = [
    { key: "dream", title: "想去的地方", sub: "THE WANDERLUST" },
    { key: "memory", title: "去过的地方", sub: "MEMORIES MADE" },
    { key: "journey", title: "在路上", sub: "PRESENT TRAILS" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.2 }}
      className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex gap-3"
    >
      {items.map((it, i) => (
        <motion.button
          key={it.key}
          onClick={() => onSelect(it.key)}
          whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.12)" }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="group rounded-2xl px-6 py-3 backdrop-blur-xl text-left"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-1 group-hover:text-white/60 transition-colors">
            {it.sub}
          </div>
          <div className="text-white/90 text-sm font-medium">{it.title}</div>
        </motion.button>
      ))}
    </motion.div>
  );
}

// 场景全屏弹层
function SceneOverlay({
  scene,
  stats,
  onClose,
}: {
  scene: SceneType;
  stats: { countries: number; cities: number; spots: number };
  onClose: () => void;
}) {
  const conf = {
    dream: {
      title: "想去的地方",
      sub: "Dreaming forward",
      gradient: "from-blue-900/40 via-cyan-700/20 to-transparent",
      items: mockWorks.filter((w) => w.status === "want_to_go").slice(0, 6),
    },
    memory: {
      title: "去过的地方",
      sub: "Moments preserved",
      gradient: "from-amber-900/40 via-orange-700/20 to-transparent",
      items: mockWorks.filter((w) => w.status === "been_there").slice(0, 6),
    },
    journey: {
      title: "在路上",
      sub: "Wandering now",
      gradient: "from-violet-900/40 via-fuchsia-700/20 to-transparent",
      items: mockWorks.slice(0, 6),
    },
  }[scene!];

  if (!conf) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(5,8,15,0.85)", backdropFilter: "blur(24px)" }}
        onClick={onClose}
      >
        {/* 渐变光晕 */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${conf.gradient} pointer-events-none`}
        />

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-5xl w-full mx-8 rounded-3xl overflow-hidden"
          style={{
            background: "rgba(15,20,30,0.6)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(40px)",
          }}
        >
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 h-9 w-9 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all flex items-center justify-center"
          >
            ✕
          </button>

          <div className="p-10 md:p-14">
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-3">{conf.sub}</div>
            <h2
              className="text-5xl md:text-6xl font-light text-white/95 mb-2"
              style={{ fontFamily: '"Playfair Display", "Noto Serif SC", serif', letterSpacing: "-0.02em" }}
            >
              {conf.title}
            </h2>
            <p className="text-white/50 text-sm mb-10 max-w-md">
              {scene === "dream" && `心之所向，${conf.items.length} 个等待被启程的远方。`}
              {scene === "memory" && `脚印为证，${conf.items.length} 个已经刻进生命的角落。`}
              {scene === "journey" && `步履不停，每一刻都在成为下一段故事。`}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {conf.items.map((work, i) => (
                <motion.div
                  key={work.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="rounded-2xl p-4 border border-white/8 hover:border-white/20 transition-colors"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <div className="text-[10px] tracking-wider uppercase text-white/40 mb-1">
                    {work.final_country}
                  </div>
                  <div className="text-white/90 text-base font-medium mb-0.5">
                    {work.final_attraction || work.final_city}
                  </div>
                  <div className="text-white/50 text-xs">{work.final_city}</div>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] tracking-wider uppercase">
                    {work.status === "been_there" ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-emerald-300/80">已抵达</span>
                      </>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                        <span className="text-cyan-300/80">正启程</span>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function CoverPage() {
  const [entering, setEntering] = useState(false);
  const [stats, setStats] = useState({ countries: 0, cities: 0, spots: 0 });
  const [scene, setScene] = useState<SceneType>(null);

  useEffect(() => {
    setStats(getStats());
  }, []);

  const handleEnter = () => {
    setEntering(true);
    setTimeout(() => {
      window.location.href = "/globe";
    }, 900);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#06080d]">
      {/* 渐变氛围光 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(40,80,140,0.18) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(80,50,120,0.12) 0%, transparent 60%)",
        }}
      />

      {/* CSS 星空 */}
      <div className="absolute inset-0">
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 1.5 + 0.3 + "px",
              height: Math.random() * 1.5 + 0.3 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: 0.15 + Math.random() * 0.5,
              animation: `pulse ${2 + Math.random() * 4}s ease-in-out ${Math.random() * 4}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* 顶部导航 */}
      <TopNav />

      {/* 3D 地球 - 居中靠下，作为情感中心 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <CoverGlobe entering={entering} />
      </div>

      {/* 主标题区 */}
      <motion.div
        className="absolute top-[18%] left-0 right-0 z-10 text-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: entering ? 0 : 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <div className="text-[11px] tracking-[0.5em] uppercase text-white/40 mb-4">
          A WORLD OF YOUR OWN
        </div>
        <h1
          className="text-7xl md:text-9xl font-light text-white/95 mb-2"
          style={{
            fontFamily: '"Playfair Display", "Noto Serif SC", Georgia, serif',
            letterSpacing: "-0.02em",
            lineHeight: 1,
            background: "linear-gradient(180deg, #ffffff 0%, #a8b6cc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Journey
        </h1>
        <div
          className="text-2xl md:text-3xl mt-2"
          style={{
            fontFamily: '"Noto Serif SC", serif',
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.85)",
            fontWeight: 300,
          }}
        >
          旅途
        </div>
        <p className="mt-5 text-sm text-white/40 tracking-wider">
          一座属于你的微型世界地图
        </p>
      </motion.div>

      {/* 统计卡片 */}
      <StatsCard stats={stats} />

      {/* 三个叙事文本触发器 */}
      <StoryTriggers onSelect={setScene} />

      {/* 进入按钮 */}
      <motion.div
        className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: entering ? 0 : 1, y: entering ? 40 : 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
      >
        <EnterButton entering={entering} onEnter={handleEnter} />
      </motion.div>

      {/* 场景弹层 */}
      <SceneOverlay scene={scene} stats={stats} onClose={() => setScene(null)} />

      {/* 全局动画样式 */}
      <style jsx global>{`
        @keyframes pulse {
          from { opacity: 0.15; }
          to { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
