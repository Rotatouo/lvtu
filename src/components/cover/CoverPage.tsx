"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { mockWorks } from "@/lib/mock-data";
import {
  IcelandScene,
  TokyoScene,
  SantoriniScene,
  AlpsScene,
} from "./Scenes";

const GlobeView = dynamic(() => import("@/components/globe/GlobeView"), {
  ssr: false,
  loading: () => null,
});

// 场景配置：默认是世界地图（NASA图），其他是 SVG 风景场景
const SCENES = {
  world: { label: "World Map", type: "image" as const, src: "/textures/earth-day.jpg" },
  iceland: { label: "Northern Lights", type: "scene" as const, scene: "iceland" },
  tokyo: { label: "Tokyo Nights", type: "scene" as const, scene: "tokyo" },
  santorini: { label: "Santorini Sunset", type: "scene" as const, scene: "santorini" },
  alps: { label: "Golden Alps", type: "scene" as const, scene: "alps" },
};

// 三个英文 chapter links（底部）
type ChapterKey = "wanderlust" | "memories" | "trails";
const chapters: {
  key: ChapterKey;
  label: string;
  cn: string;
  color: string;
  filter: (w: typeof mockWorks[number]) => boolean;
}[] = [
  {
    key: "wanderlust",
    label: "THE WANDERLUST",
    cn: "想去的地方",
    color: "bg-cyan-400",
    filter: (w) => w.status === "want_to_go",
  },
  {
    key: "memories",
    label: "MEMORIES MADE",
    cn: "去过的地方",
    color: "bg-amber-400",
    filter: (w) => w.status === "been_there",
  },
  {
    key: "trails",
    label: "PRESENT TRAILS",
    cn: "在路上",
    color: "bg-violet-400",
    filter: () => true,
  },
];

// 右侧著名地点（点击切换背景）
const destinations = [
  { id: "iceland", name: "Northern Lights", subtitle: "Reykjavík · Iceland" },
  { id: "alps", name: "Golden Alps", subtitle: "Matterhorn · Switzerland" },
  { id: "tokyo", name: "Tokyo Nights", subtitle: "Shibuya · Japan" },
  { id: "santorini", name: "Santorini Sunset", subtitle: "Cyclades · Greece" },
];

function SceneLayer({ sceneKey }: { sceneKey: keyof typeof SCENES }) {
  const scene = SCENES[sceneKey];
  if (scene.type === "image") {
    return (
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${scene.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  }
  // SVG 场景
  if (scene.scene === "iceland") return <IcelandScene />;
  if (scene.scene === "tokyo") return <TokyoScene />;
  if (scene.scene === "santorini") return <SantoriniScene />;
  if (scene.scene === "alps") return <AlpsScene />;
  return null;
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
  const [openChapter, setOpenChapter] = useState<ChapterKey | null>(null);

  useEffect(() => {
    setStats(getStats());
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* ─────── 背景层 ─────── */}
      <div className="absolute inset-0">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeScene}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            <SceneLayer sceneKey={activeScene} />
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

      {/* ─────── 顶部 nav（中文 plain text） ─────── */}
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

        <div className="flex items-center gap-8">
          {["世界地图", "旅程记录", "探索灵感", "关于"].map((t) => (
            <a
              key={t}
              className="relative text-white/70 hover:text-white/95 text-sm cursor-pointer transition-colors duration-200 group"
            >
              {t}
              <span className="absolute -bottom-1 left-0 h-px bg-white/60 transition-all duration-300 w-0 group-hover:w-full" />
            </a>
          ))}
        </div>

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

          {/* 输入框 */}
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
                className="px-5 py-2 rounded-full text-sm text-white font-medium cursor-not-allowed opacity-60"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  color: "#0a1424",
                }}
              >
                开始
              </button>
            </div>
          </div>

          {/* 底部：三个英文 chapter 链接（点击弹地点） */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/30 mb-3">
              STORIES CURATED
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] tracking-[0.3em] uppercase">
              {chapters.map((ch, i) => (
                <span key={ch.key} className="flex items-center gap-x-5">
                  <button
                    onClick={() => setOpenChapter(ch.key)}
                    className="flex items-center gap-2 group text-white/55 hover:text-white/85 transition-colors"
                  >
                    <span
                      className={`h-1 w-1 rounded-full ${ch.color} group-hover:scale-150 transition-transform`}
                    />
                    {ch.label}
                  </button>
                  {i < chapters.length - 1 && (
                    <span className="text-white/15">·</span>
                  )}
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

      {/* ─────── 右侧著名地点列表（点击 → 切换背景） ─────── */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1.4 }}
        className="absolute right-8 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-2 max-w-[20rem] pointer-events-none"
      >
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/35 mb-2 pointer-events-auto">
          FEATURED LANDMARKS
        </div>

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
                <div
                  className="w-10 h-10 rounded-lg shrink-0 relative overflow-hidden"
                  style={{
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  {/* 不同场景用不同背景模拟缩略图 */}
                  {sceneId === "world" && (
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: "url(/textures/earth-day.jpg)",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  )}
                  {sceneId === "iceland" && (
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(160deg, #0a1f1a 0%, #0d4a25 50%, #1a3a5c 100%)",
                      }}
                    />
                  )}
                  {sceneId === "tokyo" && (
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(165deg, #16114a 0%, #52155a 50%, #83206a 100%)",
                      }}
                    />
                  )}
                  {sceneId === "santorini" && (
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(160deg, #256387 0%, #f2994a 50%, #f8c977 100%)",
                      }}
                    />
                  )}
                  {sceneId === "alps" && (
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(155deg, #6b3685 0%, #d97e3b 75%, #b8421e 100%)",
                      }}
                    />
                  )}
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

      {/* ─────── Chapter 弹层 ─────── */}
      <AnimatePresence>
        {openChapter && (
          <ChapterPopup
            chapter={chapters.find((c) => c.key === openChapter)!}
            onClose={() => setOpenChapter(null)}
          />
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

function ChapterPopup({
  chapter,
  onClose,
}: {
  chapter: (typeof chapters)[number];
  onClose: () => void;
}) {
  const items = mockWorks.filter(chapter.filter).slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex items-end justify-center pb-24 md:pb-32"
      style={{ background: "rgba(5,8,15,0.65)", backdropFilter: "blur(20px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-3xl w-full mx-6 rounded-3xl overflow-hidden"
        style={{
          background: "rgba(10,15,25,0.85)",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(40px)",
        }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-white/8 hover:bg-white/15 border border-white/15 text-white/70 hover:text-white transition-all flex items-center justify-center text-sm"
        >
          ✕
        </button>

        <div className="p-8">
          {/* 标题 */}
          <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-2">
            {chapter.label}
          </div>
          <div className="flex items-baseline gap-4 mb-6">
            <h3
              className="text-3xl font-light text-white/95"
              style={{ fontFamily: '"Playfair Display", "Noto Serif SC", serif' }}
            >
              {chapter.cn}
            </h3>
            <span className="text-sm text-white/40">
              {items.length} 个目的地
            </span>
          </div>

          {/* 地点卡片网格 */}
          {items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {items.map((work, i) => (
                <motion.div
                  key={work.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i }}
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
          ) : (
            <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-white/40 text-sm">暂无此地目的地</p>
              <p className="text-white/30 text-xs mt-2">
                下一个远方，由你来标记
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
