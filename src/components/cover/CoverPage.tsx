"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { mockWorks } from "@/lib/mock-data";

const GlobeView = dynamic(() => import("@/components/globe/GlobeView"), {
  ssr: false,
  loading: () => null,
});

type SceneType = {
  name: string;
  subtitle?: string;
  gradient?: string;
  overlay?: string;
  emoji?: string;
} | null;

function getStats() {
  const been = mockWorks.filter((w) => w.status === "been_there");
  const countries = new Set(been.map((w) => w.final_country).filter(Boolean));
  const cities = new Set(been.map((w) => w.final_city).filter(Boolean));
  const spots = new Set(been.map((w) => w.final_attraction).filter(Boolean));
  return { countries: countries.size, cities: cities.size, spots: spots.size };
}

// 著名地点数据（每个都有独特的电影感配色）
const destinations = [
  {
    id: "golden-alps",
    name: "Golden Alps",
    subtitle: "Matterhorn · Switzerland",
    summary: "Folded mountains catch the morning light",
    gradient: "from-amber-300 via-orange-400 to-rose-500",
    overlay: "linear-gradient(135deg, #fde68a 0%, #f59e0b 50%, #9d174d 100%)",
  },
  {
    id: "tokyo-nights",
    name: "Tokyo Nights",
    subtitle: "Shibuya · Japan",
    summary: "Light pouring through every alley of the capital",
    gradient: "from-indigo-900 via-fuchsia-700 to-pink-500",
    overlay: "linear-gradient(135deg, #1e1b4b 0%, #a21caf 50%, #ec4899 100%)",
  },
  {
    id: "santorini-sunset",
    name: "Santorini Sunset",
    subtitle: "Cyclades · Greece",
    summary: "When white walls blush gold against the sea",
    gradient: "from-sky-300 via-cyan-200 to-amber-200",
    overlay: "linear-gradient(135deg, #bae6fd 0%, #7dd3fc 50%, #fbbf24 100%)",
  },
  {
    id: "northern-lights",
    name: "Northern Lights",
    subtitle: "Reykjavík · Iceland",
    summary: "Where night sky dances its own colors",
    gradient: "from-emerald-400 via-cyan-600 to-indigo-700",
    overlay: "linear-gradient(135deg, #064e3b 0%, #0891b2 50%, #312e81 100%)",
  },
];

const chapters = [
  { key: "wanderlust", label: "The Wanderlust", cn: "想去的地方", color: "bg-cyan-400" },
  { key: "memories", label: "Memories Made", cn: "去过的地方", color: "bg-amber-400" },
  { key: "trails", label: "Present Trails", cn: "在路上", color: "bg-violet-400" },
];

export default function CoverPage() {
  const [entering, setEntering] = useState(false);
  const [stats, setStats] = useState({ countries: 0, cities: 0, spots: 0 });
  const [scene, setScene] = useState<SceneType>(null);
  const [inputValue, setInputValue] = useState("");
  const [bgKey, setBgKey] = useState(0); // 用来在 CSS background 切换时触发过渡

  useEffect(() => {
    setStats(getStats());
  }, []);

  const handleEnter = () => {
    setEntering(true);
    setTimeout(() => {
      window.location.href = "/globe";
    }, 900);
  };

  const handleStart = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      // 输入了地点 → 打开场景预览（不跳转）
      setScene({ name: trimmed });
    } else {
      // 没输入 → 直接跳转
      handleEnter();
    }
  };

  const handleDestinationClick = (dest: (typeof destinations)[number]) => {
    setBgKey((k) => k + 1);
    setScene({ name: dest.name, subtitle: dest.subtitle, gradient: dest.overlay });
  };

  const handleChapterClick = (key: string) => {
    const ch = chapters.find((c) => c.key === key);
    if (ch) setScene({ name: ch.cn });
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* ─────── 背景层 ─────── */}
      <div className="absolute inset-0">
        {/* 默认真实地球图 */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-[1500ms] ease-out"
          style={{
            backgroundImage: "url('/textures/earth-day.jpg')",
            backgroundPosition: "center",
            opacity: 0.55,
          }}
        />
        {/* 渐变压暗（让左侧文字清晰） */}
        <div
          className="absolute inset-0"
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
              "radial-gradient(ellipse at 25% 35%, rgba(60,100,160,0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 75%, rgba(120,70,160,0.12) 0%, transparent 60%)",
          }}
        />
        {/* 微星空 */}
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
                animation: `twinkle ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 3}s infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ─────── 顶部 nav ─────── */}
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

        <div className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
          {chapters.map((c) => (
            <button
              key={c.key}
              onClick={() => handleChapterClick(c.key)}
              className="text-white/70 hover:text-white/95 px-4 py-1 text-sm rounded-full hover:bg-white/8 transition-all"
            >
              {c.label}
            </button>
          ))}
        </div>

        <button className="px-5 py-2 rounded-full bg-white/8 hover:bg-white/12 backdrop-blur-md border border-white/10 text-white/85 text-sm transition-all">
          登录
        </button>
      </motion.nav>

      {/* ─────── 主内容（左对齐） ─────── */}
      <div className="relative z-10 h-full flex flex-col justify-center px-10 md:px-20 max-w-[55%]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: entering ? 0 : 1 }}
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

          {/* 输入框（Lumora 式输入 + 内置开始按钮） */}
          <motion.div
            className="flex items-center gap-3 max-w-md mb-10"
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
              <span className="text-white/30 mr-3 text-lg">📍</span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="下一站想去哪里？"
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                className="bg-transparent outline-none text-white/85 text-sm flex-1 placeholder:text-white/30"
              />
              <button
                onClick={handleStart}
                className="ml-3 px-5 py-2 rounded-full text-sm text-white font-medium transition-all hover:scale-105"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  color: "#0a1424",
                }}
              >
                {inputValue.trim() ? "看看" : "开始"}
              </button>
            </div>
          </motion.div>

          {/* 三个章节链接（稍微突出，但保持简洁，等后续做独立分支） */}
          <motion.div
            className="flex items-center gap-4"
            animate={{ opacity: entering ? 0 : 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            {chapters.map((c, i) => (
              <button
                key={c.key}
                onClick={() => handleChapterClick(c.key)}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 transition-all"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${c.color} group-hover:scale-125 transition-transform`} />
                <span className="text-[10px] tracking-[0.3em] uppercase text-white/55 group-hover:text-white/85 transition-colors">
                  {c.label}
                </span>
              </button>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ─────── 右侧著名地点卡片 ─────── */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: entering ? 0 : 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1.4 }}
        className="absolute right-8 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-3 max-w-[22rem] pointer-events-none"
      >
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/35 mb-1 pointer-events-auto">
          FEATURED LANDMARKS
        </div>

        {destinations.map((d, i) => (
          <motion.button
            key={d.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5 + i * 0.1, duration: 0.6 }}
            whileHover={{ x: -4 }}
            onClick={() => handleDestinationClick(d)}
            className="group rounded-2xl p-3 flex items-center gap-3 text-left pointer-events-auto transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* 渐变缩略图 */}
            <div
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${d.gradient} relative overflow-hidden shrink-0`}
              style={{ boxShadow: `0 0 20px rgba(255,255,255,0.05)` }}
            >
              {/* 缩略图内部的光斑 */}
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), transparent 60%)",
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-white/90 text-sm font-medium truncate">{d.name}</div>
              <div className="text-white/50 text-[11px] truncate mt-0.5">{d.subtitle}</div>
            </div>

            <svg
              width="14"
              height="14"
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
          </motion.button>
        ))}
      </motion.div>

      {/* ─────── 右上角统计卡 ─────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: entering ? 0 : 1, y: 0 }}
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

      {/* ─────── 底部 footer ─────── */}
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

      {/* ─────── 场景预览弹层 ─────── */}
      <AnimatePresence>
        {scene && (
          <ScenePreview scene={scene} onClose={() => setScene(null)} onEnter={handleEnter} />
        )}
      </AnimatePresence>

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

function ScenePreview({
  scene,
  onClose,
  onEnter,
}: {
  scene: NonNullable<SceneType>;
  onClose: () => void;
  onEnter: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 场景渐变背景 */}
      {scene.gradient && (
        <div
          className="absolute inset-0 transition-all duration-700 ease-out"
          style={{ background: scene.overlay || scene.gradient }}
        />
      )}
      {!scene.gradient && (
        <div
          className="absolute inset-0"
          style={{ background: "rgba(5,8,15,0.92)", backdropFilter: "blur(28px)" }}
        />
      )}

      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white/80 flex items-center justify-center transition-all"
      >
        ✕
      </button>

      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-3xl w-full mx-8 rounded-3xl overflow-hidden text-center px-12 py-14"
        style={{
          background: "rgba(8,12,20,0.55)",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(40px)",
        }}
      >
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/60 mb-3">
          {scene.subtitle || "即将启程"}
        </div>

        <h2
          className="text-5xl md:text-6xl font-light text-white mb-4"
          style={{
            fontFamily: '"Playfair Display", "Noto Serif SC", serif',
            letterSpacing: "-0.02em",
          }}
        >
          {scene.name}
        </h2>

        <p className="text-white/55 text-sm md:text-base max-w-md mx-auto mb-10 leading-relaxed">
          {scene.subtitle
            ? `正在为你准备 ${scene.name} 的旅程档案……`
            : `正在为「${scene.name}」寻找世界坐标，AI 即将开始识别……`}
        </p>

        {/* 准备中的步骤指示 */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "识别坐标", done: true },
            { label: "查找氛围图", done: false },
            { label: "加入心愿单", done: false },
          ].map((step, i) => (
            <div
              key={i}
              className="rounded-2xl px-4 py-3 border text-left"
              style={{
                background: step.done ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                borderColor: step.done ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    step.done ? "bg-emerald-400" : "bg-white/30"
                  }`}
                />
                <span
                  className={`text-[10px] tracking-wider uppercase ${
                    step.done ? "text-white/70" : "text-white/30"
                  }`}
                >
                  STEP {i + 1}
                </span>
              </div>
              <div
                className={`text-sm ${step.done ? "text-white/90" : "text-white/40"}`}
              >
                {step.label}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onEnter}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm text-white font-medium transition-all hover:scale-105"
          style={{
            background: "rgba(255,255,255,0.92)",
            color: "#0a1424",
          }}
        >
          进入 3D 地球
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14m-7-7 7 7-7 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </motion.div>
    </motion.div>
  );
}
