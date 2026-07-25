"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
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
    }, 1000);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#06080d]">
      {/* 径向氛围光（确保整页呼吸感） */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 25% 35%, rgba(50,90,150,0.22) 0%, transparent 55%), radial-gradient(ellipse at 85% 75%, rgba(100,60,140,0.16) 0%, transparent 60%)",
        }}
      />

      {/* 微星空 */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 1.3 + 0.3 + "px",
              height: Math.random() * 1.3 + 0.3 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: 0.15 + Math.random() * 0.4,
              animation: `twinkle ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 3}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* 3D 地球 — 右上角氛围角 */}
      <div className="absolute right-0 top-0 w-[60%] h-[100%] pointer-events-none">
        <GlobeView works={mockWorks} routes={[]} timeMode="auto" />
      </div>

      {/* 顶部 nav */}
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
              background: "radial-gradient(circle at 30% 30%, #ffffff, #6a8caf 60%, #1a2a45)",
              boxShadow: "0 0 10px rgba(150,180,220,0.4)",
            }}
          />
          <span className="text-white/90 text-sm tracking-[0.3em] uppercase font-medium">旅途</span>
        </div>

        <div className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
          {["世界地图", "旅程记录", "探索灵感", "关于"].map((t) => (
            <a
              key={t}
              className="text-white/70 hover:text-white/95 px-4 py-1 text-sm rounded-full hover:bg-white/8 transition-all cursor-pointer"
            >
              {t}
            </a>
          ))}
        </div>

        <button className="px-5 py-2 rounded-full bg-white/8 hover:bg-white/12 backdrop-blur-md border border-white/10 text-white/85 text-sm transition-all">
          登录
        </button>
      </motion.nav>

      {/* 主内容区（左对齐，宽呼吸） */}
      <div className="relative z-10 h-full flex flex-col justify-center px-10 md:px-20 max-w-[55%]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: entering ? 0 : 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="text-[10px] tracking-[0.5em] uppercase text-white/40 mb-4">
            A WORLD OF YOUR OWN
          </div>

          {/* 大衬线主标题 */}
          <h1
            className="text-7xl md:text-8xl lg:text-[7rem] font-light text-white leading-[0.95] mb-4"
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

          {/* 中文标题 */}
          <div
            className="text-3xl md:text-4xl mb-6"
            style={{
              fontFamily: '"Noto Serif SC", serif',
              fontWeight: 300,
              letterSpacing: "0.3em",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            旅途
          </div>

          {/* 描述 */}
          <p className="text-white/45 text-sm md:text-base leading-relaxed tracking-wider max-w-md mb-12">
            一座属于你的微型世界地图。
            <br />
            把每一份心之所向变成清晰的远方。
          </p>

          {/* CTA 输入框风格（Lumora 式） */}
          <motion.div
            className="flex items-center gap-3 max-w-md mb-8"
            animate={{ y: entering ? 60 : 0, opacity: entering ? 0 : 1 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <div
              className="flex-1 rounded-full px-6 py-3.5 flex items-center"
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
                onClick={handleEnter}
                className="ml-3 px-5 py-2 rounded-full text-sm text-white font-medium transition-all hover:scale-105"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  color: "#0a1424",
                }}
              >
                开始
              </button>
            </div>
          </motion.div>

          {/* 三个章节链接（横向，紧凑） */}
          <motion.div
            className="flex items-center gap-6 text-[11px] tracking-[0.3em] uppercase text-white/40"
            animate={{ opacity: entering ? 0 : 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <span
              onClick={() => setScene("dream")}
              className="cursor-pointer hover:text-white/80 transition-colors flex items-center gap-2 group"
            >
              <span className="h-1 w-1 rounded-full bg-cyan-400/70 group-hover:bg-cyan-300 transition-colors" />
              The Wanderlust
            </span>
            <span className="text-white/15">·</span>
            <span
              onClick={() => setScene("memory")}
              className="cursor-pointer hover:text-white/80 transition-colors flex items-center gap-2 group"
            >
              <span className="h-1 w-1 rounded-full bg-amber-400/70 group-hover:bg-amber-300 transition-colors" />
              Memories Made
            </span>
            <span className="text-white/15">·</span>
            <span
              onClick={() => setScene("journey")}
              className="cursor-pointer hover:text-white/80 transition-colors flex items-center gap-2 group"
            >
              <span className="h-1 w-1 rounded-full bg-violet-400/70 group-hover:bg-violet-300 transition-colors" />
              Present Trails
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* 右上浮动统计卡片 */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: entering ? 0 : 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1.4 }}
        className="absolute top-28 right-10 z-20 hidden lg:block"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="rounded-2xl px-6 py-5 backdrop-blur-xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            pointerEvents: "auto",
          }}
        >
          <div className="text-[10px] text-white/40 tracking-[0.3em] uppercase mb-3">JOURNEY SO FAR</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-light text-white/95" style={{ fontFamily: '"Playfair Display", serif' }}>
              {stats.countries}
            </span>
            <span className="text-xs text-white/50">countries</span>
          </div>
          <div className="text-[11px] text-white/50">
            {stats.cities} 城市 · {stats.spots} 景点
          </div>
        </div>
      </motion.div>

      {/* 底部 footer（跟 Lumora 一样） */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: entering ? 0 : 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.6 }}
        className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-12 text-[10px] tracking-[0.3em] uppercase text-white/30"
      >
        <span>3D Interactive Globe</span>
        <span className="text-white/15">·</span>
        <span>AI Powered Stories</span>
        <span className="text-white/15">·</span>
        <span>Personal Universe</span>
      </motion.div>

      {/* 章节弹层 */}
      <AnimatePresence>
        {scene && (
          <ChapterModal scene={scene} onClose={() => setScene(null)} />
        )}
      </AnimatePresence>

      {/* 全局动画 */}
      <style jsx global>{`
        @keyframes twinkle {
          from { opacity: 0.1; }
          to { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

function ChapterModal({ scene, onClose }: { scene: SceneType; onClose: () => void }) {
  const conf = {
    dream: {
      title: "想去的地方",
      subtitle: "The Wanderlust",
      gradient: "from-cyan-900/40 via-blue-800/20 to-transparent",
      items: mockWorks.filter((w) => w.status === "want_to_go").slice(0, 6),
    },
    memory: {
      title: "去过的地方",
      subtitle: "Memories Made",
      gradient: "from-amber-900/40 via-orange-800/20 to-transparent",
      items: mockWorks.filter((w) => w.status === "been_there").slice(0, 6),
    },
    journey: {
      title: "在路上",
      subtitle: "Present Trails",
      gradient: "from-violet-900/40 via-fuchsia-800/20 to-transparent",
      items: mockWorks.slice(0, 6),
    },
  }[scene!];

  if (!conf) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(5,8,15,0.88)", backdropFilter: "blur(28px)" }}
      onClick={onClose}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${conf.gradient} pointer-events-none`} />

      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full mx-8 rounded-3xl overflow-hidden"
        style={{
          background: "rgba(15,20,30,0.65)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(40px)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 h-9 w-9 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all flex items-center justify-center"
        >
          ✕
        </button>

        <div className="p-12">
          <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-2">
            {conf.subtitle}
          </div>
          <h2
            className="text-5xl font-light text-white/95 mb-6"
            style={{ fontFamily: '"Playfair Display", "Noto Serif SC", serif', letterSpacing: "-0.02em" }}
          >
            {conf.title}
          </h2>
          <p className="text-white/50 text-sm mb-8 max-w-md">
            {scene === "dream" && `心之所向，${conf.items.length} 个等待启程的远方。`}
            {scene === "memory" && `脚印为证，${conf.items.length} 个已经刻进生命的角落。`}
            {scene === "journey" && `步履不停，每一刻都在成为下一段故事。`}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {conf.items.map((work, i) => (
              <motion.div
                key={work.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i }}
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
  );
}
