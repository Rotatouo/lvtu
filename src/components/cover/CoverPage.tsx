"use client";

import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2 } from "lucide-react";
import { mockWorks } from "@/lib/mock-data";
import type { Route as RouteType } from "@/types";

const GlobeView = dynamic(() => import("@/components/globe/GlobeView"), {
  ssr: false,
  loading: () => null,
});

// ──────────────────────────────────────────────────────────
// 5 个著名地点（World Map + 4 张用户实拍）
// 照片用真实图片，不要放大撑满（避免模糊）
// ──────────────────────────────────────────────────────────
type SceneKey = "world" | "matterhorn" | "trossachs" | "liriver" | "iceland";

const LANDMARKS: {
  key: SceneKey;
  name: string;
  subtitle: string;
  thumb: string;
}[] = [
  {
    key: "world",
    name: "World Map",
    subtitle: "NASA · real-time imagery",
    thumb: "/textures/earth-day.jpg",
  },
  {
    key: "matterhorn",
    name: "Matterhorn",
    subtitle: "Zermatt · Switzerland",
    thumb: "/destinations/matterhorn.jpg",
  },
  {
    key: "trossachs",
    name: "The Trossachs",
    subtitle: "Stirlingshire · Scotland",
    thumb: "/destinations/trossachs.jpg",
  },
  {
    key: "liriver",
    name: "Li River",
    subtitle: "Guilin · China",
    thumb: "/destinations/li-river.jpg",
  },
  {
    key: "iceland",
    name: "Jökulsárlón",
    subtitle: "Aurora over glacier lagoon",
    thumb: "/destinations/iceland.jpg",
  },
];

// ──────────────────────────────────────────────────────────
// 3 个英文 chapter links（底部弹层）
// ──────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────
// 背景层：5 个场景
//  - world: NASA earth-day.jpg（v0.6.6-pre 风格：无 filter、无动画、center 对齐）
//  - 其他 4 个：真实照片，NO Ken Burns / NO scale（保持原图清晰度）
// ──────────────────────────────────────────────────────────

function WorldBackground() {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: "url(/textures/earth-day.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
  );
}

function PhotoBackground({ src }: { src: string }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
  );
}

function SceneLayer({ sceneKey }: { sceneKey: SceneKey }) {
  const landmark = LANDMARKS.find((l) => l.key === sceneKey)!;
  if (sceneKey === "world") return <WorldBackground />;
  return <PhotoBackground src={landmark.thumb} />;
}

// ──────────────────────────────────────────────────────────
// 真实数据：从 mock + API 拉取
// ──────────────────────────────────────────────────────────

function getMockStats() {
  const been = mockWorks.filter((w) => w.status === "been_there");
  const countries = new Set(been.map((w) => w.final_country).filter(Boolean));
  const cities = new Set(been.map((w) => w.final_city).filter(Boolean));
  const spots = new Set(been.map((w) => w.final_attraction).filter(Boolean));
  return { countries: countries.size, cities: cities.size, spots: spots.size };
}

// ════════════════════════════════════════════════════════
// 主页面
// ════════════════════════════════════════════════════════

export default function CoverPage() {
  const [stats, setStats] = useState({ countries: 0, cities: 0, spots: 0 });
  const [activeScene, setActiveScene] = useState<SceneKey>("world");
  const [openChapter, setOpenChapter] = useState<ChapterKey | null>(null);
  const [routeCount, setRouteCount] = useState(0);
  const [countryCount, setCountryCount] = useState(0);

  useEffect(() => {
    // Mock 部分（city/spot 从 mock-data 取）
    setStats(getMockStats());

    // 真实 API 部分（countries、routes 从 /api 取）
    apiFetch("/api/routes")
      .then((r) => (r.ok ? r.json() : { routes: [] }))
      .then((d) => {
        const list: RouteType[] = d.routes || [];
        setRouteCount(list.length);
      })
      .catch(() => {});

    apiFetch("/api/works")
      .then((r) => (r.ok ? r.json() : { works: [] }))
      .then((d) => {
        const works = (d.works || []) as Array<{ final_country?: string }>;
        const countries = new Set(
          works.map((w) => w.final_country).filter(Boolean)
        );
        setCountryCount(countries.size);
      })
      .catch(() => {});
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

        {/* 左侧文字加深遮罩（与 v0.6.6-pre 一致） */}
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
        {/* 微星空（仅在世界地图场景下） */}
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

      {/* ─────── 顶部 nav（中文 plain text，与 v0.6.6-pre 一致） ─────── */}
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
      <div className="relative z-10 h-full flex flex-col justify-center px-10 md:px-20 max-w-[60%]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {/* 顶部小标（v0.6.6-pre 风格） */}
          <div className="text-[10px] tracking-[0.5em] uppercase text-white/40 mb-5">
            A WORLD OF YOUR OWN
          </div>

          {/* 主标题：v0.6.9 文案 + v0.6.6-pre 排版 + 中等字号 */}
          <h1
            className="text-6xl md:text-7xl font-light text-white leading-[1.05] mb-5"
            style={{
              fontFamily: '"Playfair Display", "Noto Serif SC", Georgia, serif',
              letterSpacing: "-0.025em",
            }}
          >
            Every Saved Place
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #d8e4f5 0%, #7da3d0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontStyle: "italic",
              }}
            >
              Begins a New Journey
            </span>
            <span className="text-white/30 text-3xl md:text-4xl align-top ml-2">.</span>
          </h1>

          {/* 中文大标（v0.6.6-pre 风格） */}
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

          {/* 中文副标（v0.6.6-pre 文案） */}
          <p className="text-white/50 text-sm md:text-base leading-relaxed tracking-wider max-w-md mb-6">
            一座属于你的微型世界地图。
            <br />
            把每一份心之所向变成清晰的远方。
          </p>

          {/* 英文副标（用户要求保留） */}
          <p className="text-white/60 text-xs md:text-sm leading-relaxed max-w-md mb-8">
            Upload travel inspiration from anywhere.
            <br />
            AI finds the place. You start the adventure.
          </p>

          {/* 上传截图框（v0.6.7 风格）→ 跳转到首页 #upload-anchor */}
          <Link
            href="/#upload-anchor"
            className="group block max-w-md mb-8 rounded-2xl px-5 py-4 cursor-pointer hover:scale-[1.015] transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1.5px dashed rgba(255,255,255,0.22)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                style={{ background: "rgba(255,255,255,0.10)" }}
              >
                ↑
              </div>
              <div className="text-left flex-1">
                <div className="text-white/90 text-sm font-medium">
                  Drop screenshot here
                </div>
                <div className="text-white/45 text-[11px] mt-0.5">
                  点击跳转上传截图页
                </div>
              </div>
              <div className="text-white/30 group-hover:text-white/70 group-hover:translate-x-1 transition-all">
                →
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-white/30">
              <span>📸 Xiaohongshu</span>
              <span className="text-white/15">·</span>
              <span>🎵 TikTok</span>
              <span className="text-white/15">·</span>
              <span>📷 Instagram</span>
            </div>
          </Link>

          {/* 底部统计行：3 项数据 + 实时同步 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="flex items-center gap-12 mb-8"
          >
            {[
              { value: stats.countries || countryCount, label: "Destinations Saved" },
              { value: countryCount, label: "Countries" },
              { value: routeCount, label: "Planned Routes" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div
                  className="text-3xl md:text-4xl font-light text-white"
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    textShadow: "0 2px 16px rgba(0,0,0,0.35)",
                  }}
                >
                  {s.value}
                </div>
                <div className="text-[9px] tracking-[0.3em] uppercase text-white/45 mt-1.5">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* 底部：三个英文 chapter 链接（v0.6.6-pre 风格） */}
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

      {/* ─────── 右上统计卡（JOURNEY SO FAR，从 mock 取） ─────── */}
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

      {/* ─────── 右侧著名地点列表（5 个：World Map + 4 张用户实拍） ─────── */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1.4 }}
        className="absolute right-8 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-2 max-w-[17rem] pointer-events-none"
      >
        <div className="flex items-center gap-2 mb-2 px-3 pointer-events-auto">
          <Globe2 size={11} className="text-white/40" />
          <div className="text-[10px] tracking-[0.4em] uppercase text-white/45">
            FEATURED · 5 LANDS
          </div>
        </div>

        {LANDMARKS.map((landmark) => {
          const isActive = activeScene === landmark.key;
          return (
            <button
              key={landmark.key}
              onClick={() => setActiveScene(landmark.key)}
              className="group flex items-center gap-3 p-2.5 rounded-xl text-left pointer-events-auto transition-all duration-300"
              style={{
                background: isActive
                  ? "rgba(255,255,255,0.10)"
                  : "rgba(255,255,255,0.025)",
                border: isActive
                  ? "1px solid rgba(255,255,255,0.22)"
                  : "1px solid rgba(255,255,255,0.07)",
                transform: isActive ? "translateX(-6px)" : "translateX(0)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div
                className="w-11 h-11 rounded-lg shrink-0 border overflow-hidden"
                style={{
                  backgroundImage: `url('${landmark.thumb}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  borderColor: "rgba(255,255,255,0.12)",
                }}
              />
              <div className="flex-1 min-w-0">
                <div
                  className={`text-[13px] truncate font-medium ${
                    isActive ? "text-white" : "text-white/85 group-hover:text-white"
                  }`}
                >
                  {landmark.name}
                </div>
                <div className="text-white/45 text-[10px] truncate">
                  {landmark.subtitle}
                </div>
              </div>
              {isActive ? (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ) : (
                <div className="text-white/30 group-hover:text-white/70 transition-colors text-sm">
                  ›
                </div>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* ─────── 底部 footer（v0.6.6-pre 风格） ─────── */}
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

// ════════════════════════════════════════════════════════
// Chapter 弹层（沿用 v0.6.6-pre）
// ════════════════════════════════════════════════════════

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
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-white/8 hover:bg-white/15 border border-white/15 text-white/70 hover:text-white transition-all flex items-center justify-center text-sm"
        >
          ✕
        </button>

        <div className="p-8">
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
            <div className="text-center text-white/40 py-12 text-sm">
              暂无内容
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}