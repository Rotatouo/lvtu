"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search, X, LayoutGrid, Map, BookOpen, BarChart3, Image, Sparkles, Route } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import type { Work, UploadStatus, Route as RouteType } from "@/types";
import UploadZone from "@/components/UploadZone";
import CardGrid from "@/components/CardGrid";
import EditDrawer from "@/components/EditDrawer";
import ManualAddModal from "@/components/ManualAddModal";
import ImageViewer from "@/components/ImageViewer";
import EmptyState from "@/components/EmptyState";
import UploadResultModal from "@/components/UploadResultModal";
import JournalEditor from "@/components/JournalEditor";
import LiquidCursor from "@/components/home/LiquidCursor";
import {
  MatterhornScene,
  TrossachsScene,
  LiRiverScene,
  IcelandAuroraScene,
  WorldMapScene,
} from "@/components/home/SceneBackgrounds";

const GlobeView = dynamic(() => import("@/components/globe/GlobeView"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-black" />,
});

// ════════════════════════════════════════════════════════
// Atlas 4 面板工作流
// ════════════════════════════════════════════════════════

function AtlasWorkflowShowcase() {
  return (
    <section
      className="relative py-24 px-4 md:px-8"
      style={{ background: "rgba(5,8,13,0.6)" }}
    >
      <div className="max-w-7xl mx-auto mb-16">
        <div className="text-[10px] tracking-[0.5em] uppercase text-white/40 mb-4">
          THE JOURNEY · IN FOUR STEPS
        </div>
        <h2
          className="text-5xl md:text-6xl font-light text-white/95 max-w-2xl"
          style={{
            fontFamily: '"Playfair Display", serif',
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          From screenshot to story,<br />
          <span
            style={{
              background: "linear-gradient(135deg, #d8e4f5 0%, #7da3d0 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontStyle: "italic",
            }}
          >
            in moments.
          </span>
        </h2>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <PanelFrame num="1" title="上传截图" cn="AI 识别中">
          <Panel1Mockup />
        </PanelFrame>
        <PanelFrame num="2" title="识别成功" cn="自动定位到地图">
          <Panel2Mockup />
        </PanelFrame>
        <PanelFrame num="3" title="景点详情" cn="完整档案">
          <Panel3Mockup />
        </PanelFrame>
        <PanelFrame num="4" title="添加到路线" cn="生成旅行计划">
          <Panel4Mockup />
        </PanelFrame>
      </div>
    </section>
  );
}

function PanelFrame({ num, title, cn, children }: { num: string; title: string; cn: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden relative group"
      style={{
        background: "rgba(15,20,30,0.5)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="px-6 pt-6 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span
            className="text-3xl font-light text-white/80"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            {num}
          </span>
          <span
            className="text-xl"
            style={{ fontFamily: '"Noto Serif SC", serif', color: "rgba(255,255,255,0.75)" }}
          >
            {cn}
          </span>
        </div>
        <span className="text-[9px] tracking-[0.3em] uppercase text-white/30">STEP {num}</span>
      </div>
      <div className="aspect-[4/3] mt-4 relative overflow-hidden">{children}</div>
      <div className="px-6 pb-6 pt-4 border-t border-white/5">
        <h3 className="text-white/90 text-base font-medium">{title}</h3>
      </div>
    </div>
  );
}

function Panel1Mockup() {
  return (
    <div className="absolute inset-0 p-6 flex flex-col gap-3">
      <div
        className="flex-1 rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden"
        style={{ borderColor: "rgba(255,255,255,0.15)" }}
      >
        <div className="absolute inset-3 rounded-lg overflow-hidden bg-gradient-to-br from-amber-100/30 to-rose-200/30 backdrop-blur">
          <div className="w-full h-full flex items-center justify-center relative">
            <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-rose-200 via-amber-100 to-emerald-100 opacity-60" />
            <div className="absolute bottom-4 left-3 right-3 text-[9px] text-white/60 tracking-wider uppercase">
              Screenshot · Tokyo.jpg
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-white/50">
        <span className="opacity-60">📸 Xiaohongshu</span>
        <span>·</span>
        <span className="opacity-60">🎵 TikTok</span>
        <span>·</span>
        <span className="opacity-60">📷 IG</span>
      </div>
      <div className="space-y-1.5">
        {[
          { label: "上传图片", done: true },
          { label: "分析内容", done: true },
          { label: "识别位置", done: true },
          { label: "提取详情", done: false },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px]">
            <span
              className={`h-3 w-3 rounded-full border ${
                s.done ? "bg-emerald-400 border-emerald-400" : "border-white/30"
              }`}
            >
              {s.done && (
                <span className="block text-[8px] text-emerald-900 leading-3 text-center">✓</span>
              )}
            </span>
            <span className={s.done ? "text-white/70" : "text-white/40"}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel2Mockup() {
  return (
    <div className="absolute inset-0 p-4 flex flex-col gap-2">
      <div
        className="rounded-lg px-3 py-2 flex items-center gap-2"
        style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-[10px] text-emerald-200 font-medium">识别成功</span>
      </div>
      <div
        className="flex-1 rounded-xl relative overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at 30% 40%, rgba(15,42,79,0.85), rgba(5,8,13,1)), radial-gradient(circle at 70% 60%, rgba(15,60,40,0.4), transparent)",
        }}
      >
        <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 100 100" preserveAspectRatio="none">
          {[20, 40, 60, 80].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="white" strokeWidth="0.3" />
          ))}
          {[25, 50, 75].map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="100" stroke="white" strokeWidth="0.3" />
          ))}
        </svg>
        <div
          className="absolute"
          style={{
            left: "20%",
            top: "25%",
            width: "30%",
            height: "35%",
            background: "rgba(45,90,55,0.5)",
            borderRadius: "40%",
            filter: "blur(3px)",
          }}
        />
        <div
          className="absolute"
          style={{
            left: "55%",
            top: "30%",
            width: "20%",
            height: "30%",
            background: "rgba(45,90,55,0.5)",
            borderRadius: "40%",
            filter: "blur(3px)",
          }}
        />
        <div className="absolute" style={{ left: "70%", top: "38%" }}>
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-40" style={{ width: "16px", height: "16px" }} />
            <div className="relative w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-lg" />
          </div>
        </div>
      </div>
      <div className="text-[10px] text-cyan-300 underline">View Details →</div>
    </div>
  );
}

function Panel3Mockup() {
  return (
    <div className="absolute inset-0 p-4 flex flex-col gap-2">
      <div
        className="h-24 rounded-xl relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #ec4899 0%, #f59e0b 50%, #84cc16 100%)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/30 flex items-center justify-center text-white/80 text-[10px]">✕</div>
        <div className="absolute bottom-2 left-2 text-[9px] text-white/70 tracking-wider uppercase">
          Sensō-ji · Tokyo
        </div>
      </div>
      <div
        className="flex-1 rounded-xl p-3 space-y-1.5"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-1.5 text-[10px] text-white/90 font-medium">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          Sensō-ji Temple
        </div>
        <div className="text-[9px] text-white/50 leading-relaxed line-clamp-3">
          Sensō-ji 是东京最古老的佛教寺院，创建于 628 年…
        </div>
        <div className="flex gap-1.5 pt-1">
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/8 text-white/60">Temple</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/8 text-white/60">Historic</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/8 text-white/60">Culture</span>
        </div>
      </div>
      <button
        className="w-full py-2 rounded-full text-[10px] font-medium"
        style={{ background: "rgba(245,158,11,0.85)", color: "#0a1424" }}
      >
        Add to Wishlist
      </button>
    </div>
  );
}

function Panel4Mockup() {
  return (
    <div className="absolute inset-0 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-white/90 font-medium">Japan Autumn Trip</span>
        <div className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 text-[8px]">4</span>
          <span className="text-white/50 text-[9px]">destinations</span>
        </div>
      </div>
      <div className="flex-1 rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        {[
          { city: "Tokyo", site: "Sensō-ji", tag: "Temple" },
          { city: "Hakone", site: "Lake Ashi", tag: "Nature" },
          { city: "Kyoto", site: "Fushimi Inari", tag: "Historic" },
          { city: "Osaka", site: "Osaka Castle", tag: "Castle" },
        ].map((d, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5 border-b border-white/5 last:border-0">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-rose-200 to-amber-100 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[9px] text-white/85 truncate">{d.site}</div>
              <div className="text-[8px] text-white/45 truncate">{d.city}</div>
            </div>
            <span className="text-[8px] px-1 py-0.5 rounded bg-white/8 text-white/55">{d.tag}</span>
            <div className="w-5 h-5 rounded-full text-[9px] font-medium flex items-center justify-center text-white" style={{ background: "#f59e0b" }}>
              {i + 1}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[9px]">
        <div><span className="text-white/85 font-medium">8 Days</span><span className="text-white/40 ml-1">Duration</span></div>
        <div><span className="text-white/85 font-medium">4</span><span className="text-white/40 ml-1">Stops</span></div>
        <div><span className="text-white/85 font-medium">1.2k km</span><span className="text-white/40 ml-1">Distance</span></div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// 著名地点场景配置（依据用户提供的 4 张照片）
// ════════════════════════════════════════════════════════

type SceneKey = "world" | "matterhorn" | "trossachs" | "liriver" | "iceland";

const LANDMARKS: {
  key: SceneKey;
  name: string;
  subtitle: string;
  thumb: string;
  sceneComponent: () => React.ReactNode;
}[] = [
  {
    key: "world",
    name: "World Map",
    subtitle: "Real-time NASA imagery",
    thumb: "url('/textures/earth-day.jpg')",
    sceneComponent: () => <WorldMapScene />,
  },
  {
    key: "matterhorn",
    name: "Matterhorn",
    subtitle: "Zermatt · Switzerland",
    thumb: "linear-gradient(160deg, #6b7d96 0%, #dde6f0 50%, #ffffff 100%)",
    sceneComponent: () => <MatterhornScene />,
  },
  {
    key: "trossachs",
    name: "The Trossachs",
    subtitle: "Stirlingshire · Scotland",
    thumb: "linear-gradient(160deg, #4a1830 0%, #e8633c 70%, #f5b06c 100%)",
    sceneComponent: () => <TrossachsScene />,
  },
  {
    key: "liriver",
    name: "Li River",
    subtitle: "Guilin · China",
    thumb: "linear-gradient(160deg, #806050 0%, #f5d8b8 50%, #d4a880 100%)",
    sceneComponent: () => <LiRiverScene />,
  },
  {
    key: "iceland",
    name: "Jökulsárlón",
    subtitle: "Aurora over glacier lagoon",
    thumb: "linear-gradient(160deg, #02110a 0%, #22d3a7 50%, #0a2a30 100%)",
    sceneComponent: () => <IcelandAuroraScene />,
  },
];

// ════════════════════════════════════════════════════════
// 主页面
// ════════════════════════════════════════════════════════

export default function Home() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [viewingWork, setViewingWork] = useState<Work | null>(null);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [resultWork, setResultWork] = useState<Work | null>(null);
  const [journalWork, setJournalWork] = useState<Work | null>(null);
  const [journalIds, setJournalIds] = useState<Set<string>>(new Set());
  const [recs, setRecs] = useState<Array<{ name: string; reason: string }>>([]);
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "map">("card");
  const [heroMouseX, setHeroMouseX] = useState(0);
  const [activeScene, setActiveScene] = useState<SceneKey>("world");

  const filteredWorks = useMemo(() => {
    if (!searchQuery.trim()) return works;
    const q = searchQuery.toLowerCase();
    return works.filter((w) => {
      const fields = [
        w.final_country,
        w.final_region,
        w.final_city,
        w.final_attraction,
        w.ai_country,
        w.ai_region,
        w.ai_city,
        w.ai_attraction,
      ];
      return fields.some((f) => f?.toLowerCase().includes(q));
    });
  }, [works, searchQuery]);

  const fetchWorks = useCallback(async () => {
    try {
      const res = await fetch("/api/works");
      const data = await res.json();
      if (data.works) setWorks(data.works);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorks();
    fetch("/api/journals")
      .then((r) => r.json())
      .then((d) => {
        const ids = new Set<string>((d.journals || []).map((j: any) => j.work_id));
        setJournalIds(ids);
      })
      .catch(() => {});
    fetch("/api/recommend")
      .then((r) => r.json())
      .then((d) => setRecs(d.recommendations || []))
      .catch(() => {});
    fetch("/api/routes")
      .then((r) => r.json())
      .then((d) => setRoutes(d.routes || []))
      .catch(() => {});
  }, [fetchWorks]);

  const handleUploadResult = (work: Work) => {
    setWorks((prev) => [work, ...prev]);
    setUploadStatus("done");
    setResultWork(work);
  };

  const handleEditWork = (work: Work) => setEditingWork(work);
  const handleSaveEdit = (updatedWork: Work) => {
    setWorks((prev) => prev.map((w) => (w.id === updatedWork.id ? updatedWork : w)));
    setEditingWork(null);
  };
  const handleViewWork = (work: Work) => setViewingWork(work);
  const handleManualAdd = (work: Work) => setWorks((prev) => [work, ...prev]);

  const handleDeleteWork = async (work: Work) => {
    const label = work.final_attraction || work.final_city || work.final_country || "未知地点";
    if (!window.confirm(`确定删除「${label}？`)) return;
    setWorks((prev) => prev.filter((w) => w.id !== work.id));
    try {
      await fetch(`/api/works/${work.id}`, { method: "DELETE" });
      fetchWorks();
    } catch {
      fetchWorks();
    }
  };

  const handleStatusToggle = async (work: Work) => {
    const newStatus = work.status === "been_there" ? "want_to_go" : "been_there";
    setWorks((prev) => prev.map((w) => (w.id === work.id ? { ...w, status: newStatus } : w)));
    try {
      await fetch(`/api/works/${work.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      /* ignore */
    }
  };

  const handleOpenJournal = (work: Work) => setJournalWork(work);
  const handleJournalSaved = () => {
    setJournalWork(null);
    fetchWorks();
  };

  const handleReorder = async (sortedWorks: Work[]) => {
    setWorks(sortedWorks);
    try {
      await fetch("/api/works/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: sortedWorks.map((w, i) => ({ id: w.id, sort_order: i })),
        }),
      });
    } catch {
      /* ignore */
    }
  };

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    setHeroMouseX(x);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06080d]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-cyan-400" />
      </div>
    );
  }

  const stats = {
    destinations: works.length,
    countries: new Set(works.map((w) => w.final_country).filter(Boolean)).size,
    routes: routes.length,
  };

  const currentScene = LANDMARKS.find((l) => l.key === activeScene);

  return (
    <div className="min-h-screen bg-[#06080d] text-white">
      {/* ═══════════ 液态鼠标效果 ═══════════ */}
      <LiquidCursor />

      {/* ═══════════ 顶部 nav ═══════════ */}
      <nav className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-10 py-6">
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

        <div className="hidden md:flex items-center gap-8">
          {[
            { href: "/journals", label: "旅程记录" },
            { href: "/postcards", label: "明信片" },
            { href: "/dashboard", label: "我的旅程" },
            { href: "/routes", label: "路线" },
          ].map((t) => (
            <Link key={t.href} href={t.href} className="relative text-white/70 hover:text-white/95 text-sm transition-colors duration-200 group">
              {t.label}
              <span className="absolute -bottom-1 left-0 h-px bg-white/60 transition-all duration-300 w-0 group-hover:w-full" />
            </Link>
          ))}
        </div>

        <button
          onClick={() => setShowManualAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/8 hover:bg-white/15 backdrop-blur-md border border-white/10 text-white/85 text-sm transition-all"
        >
          <Plus size={13} /> 添加
        </button>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section
        className="relative h-screen min-h-[700px] w-full overflow-hidden"
        onMouseMove={handleHeroMouseMove}
      >
        {/* 背景层：根据 activeScene 切换 */}
        <div
          className="absolute inset-0 transition-transform duration-700"
          style={{
            transform: `translateX(${heroMouseX * 20}px)`,
          }}
        >
          <AnimatePresence mode="wait">
            {activeScene === "world" ? (
              <motion.div
                key="world"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0"
              >
                <GlobeView works={works} routes={routes} timeMode="auto" />
              </motion.div>
            ) : (
              <motion.div
                key={activeScene}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0"
              >
                {currentScene?.sceneComponent()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 左侧文字压暗 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(6,8,13,0.95) 0%, rgba(6,8,13,0.55) 35%, rgba(6,8,13,0.10) 65%, transparent 100%)",
          }}
        />

        {/* 微星空 */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 1.3 + 0.3 + "px",
                height: Math.random() * 1.3 + 0.3 + "px",
                top: Math.random() * 100 + "%",
                left: Math.random() * 100 + "%",
                opacity: 0.15 + Math.random() * 0.4,
              }}
            />
          ))}
        </div>

        {/* 主文案 */}
        <div className="relative z-10 h-full flex flex-col justify-center px-10 md:px-20 max-w-[60%]">
          <div className="text-[10px] tracking-[0.5em] uppercase text-white/40 mb-4">
            A WORLD OF YOUR OWN
          </div>

          <h1
            className="text-5xl md:text-7xl font-light text-white/95 mb-4 leading-[1]"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              letterSpacing: "-0.02em",
            }}
          >
            Every Saved Place
            <br />
            <span style={{ fontStyle: "italic", color: "rgba(255,255,255,0.95)" }}>Begins a New</span>{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #d8e4f5 0%, #7da3d0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontStyle: "italic",
              }}
            >
              Journey
            </span>
            <span className="text-white/30 align-top text-3xl ml-1">.</span>
          </h1>

          {/* dreamers 徽章放在标题和副标题之间（用户要求） */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex -space-x-2">
              {["#fcd34d", "#f472b6", "#818cf8", "#34d399"].map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2" style={{ background: c, borderColor: "rgba(6,8,13,1)" }} />
              ))}
            </div>
            <span className="text-[11px] text-white/65 tracking-wide">
              <strong className="text-white/95">12,540</strong> dreamers are exploring the world
            </span>
          </div>

          <p className="text-sm md:text-base text-white/55 max-w-md mb-12 leading-relaxed">
            Upload travel inspiration from anywhere.
            <br />
            AI finds the place. You start the adventure.
          </p>

          {/* （输入框已删除） */}
        </div>

        {/* 底部统计：移到中线 + 移除 97% */}
        <div className="absolute bottom-16 left-0 right-0 z-10 flex items-center justify-center gap-24 pointer-events-none">
          {[
            { value: stats.destinations, label: "Destinations Saved" },
            { value: stats.countries, label: "Countries" },
            { value: stats.routes, label: "Planned Routes" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-light text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
                {s.value}
              </div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* 著名地点列表：5 个，含 World Map */}
        <div className="absolute top-1/2 right-10 -translate-y-1/2 z-10 hidden lg:flex flex-col gap-2 max-w-[16rem] pointer-events-none">
          <div className="text-[10px] tracking-[0.4em] uppercase text-white/35 mb-2 px-3">FEATURED LANDMARKS</div>
          {LANDMARKS.map((d) => {
            const isActive = activeScene === d.key;
            return (
              <button
                key={d.key}
                onClick={() => setActiveScene(d.key)}
                className="group flex items-center gap-3 p-3 rounded-xl text-left pointer-events-auto transition-all"
                style={{
                  background: isActive
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(255,255,255,0.025)",
                  border: isActive
                    ? "1px solid rgba(255,255,255,0.18)"
                    : "1px solid rgba(255,255,255,0.06)",
                  transform: isActive ? "translateX(-4px)" : "translateX(0)",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg shrink-0 border"
                  style={{
                    background: d.thumb.startsWith("url(")
                      ? `${d.thumb} center/cover`
                      : d.thumb,
                    borderColor: "rgba(255,255,255,0.10)",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm truncate ${isActive ? "text-white" : "text-white/85 group-hover:text-white"}`}>
                    {d.name}
                  </div>
                  <div className="text-white/45 text-[10px] truncate">{d.subtitle}</div>
                </div>
                {isActive ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ) : (
                  <div className="text-white/30 group-hover:text-white/60 transition-colors text-xs">›</div>
                )}
              </button>
            );
          })}
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-[10px] tracking-[0.4em] uppercase text-white/30 pointer-events-none">
          ↓ Hover for water ripples · Scroll to continue
        </div>
      </section>

      {/* 4 面板工作流 */}
      <AtlasWorkflowShowcase />

      {/* 实际应用区 */}
      <section id="upload-anchor" className="relative px-4 md:px-8 py-16" style={{ background: "rgba(5,8,13,0.7)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-[10px] tracking-[0.5em] uppercase text-white/40 mb-3">YOUR COLLECTION</div>
            <h2 className="text-3xl md:text-4xl font-light text-white/95" style={{ fontFamily: '"Playfair Display", serif' }}>
              Begin with one photo.
            </h2>
          </div>

          <UploadZone
            onUploadStart={() => setUploadStatus("uploading")}
            onUploadComplete={handleUploadResult}
            onUploadError={() => setUploadStatus("error")}
            status={uploadStatus}
          />

          {works.length > 0 && (
            <div className="flex items-center justify-between gap-3 mt-8 mb-6">
              <div className="flex bg-white/5 backdrop-blur-md rounded-xl p-0.5 border border-white/10">
                <button
                  onClick={() => setViewMode("card")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all ${
                    viewMode === "card" ? "bg-white/15 text-white shadow-inner" : "text-white/55 hover:text-white/80"
                  }`}
                >
                  <LayoutGrid size={12} /> 卡片
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all ${
                    viewMode === "map" ? "bg-white/15 text-white shadow-inner" : "text-white/55 hover:text-white/80"
                  }`}
                >
                  <Map size={12} /> 3D 地球
                </button>
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索国家、城市、景点…"
                  className="w-full pl-9 pr-7 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/40 hover:text-white/70">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {works.length === 0 ? (
            <EmptyState onUploadClick={() => {}} />
          ) : viewMode === "card" ? (
            <CardGrid
              works={filteredWorks}
              onEdit={handleEditWork}
              onView={handleViewWork}
              onStatusToggle={handleStatusToggle}
              onDelete={handleDeleteWork}
              onReorder={handleReorder}
              onJournal={handleOpenJournal}
              journalWorkIds={journalIds}
            />
          ) : (
            <div className="h-[70vh] rounded-2xl overflow-hidden border border-white/10">
              <GlobeView works={works} routes={routes} timeMode="noon" />
            </div>
          )}

          {works.length > 0 && recs.length > 0 && (
            <div className="mt-16">
              <h3 className="flex items-center gap-2 text-sm font-medium text-white/70 mb-4">
                <Sparkles size={14} className="text-purple-400" />
                AI 推荐目的地
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {recs.map((r) => (
                  <div
                    key={r.name}
                    className="rounded-2xl p-4 min-w-[180px] shrink-0"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <p className="text-sm font-medium text-white/90">{r.name}</p>
                    <p className="text-[11px] text-white/40 mt-1 mb-3">{r.reason}</p>
                    <button
                      onClick={async () => {
                        try {
                          await fetch("/api/works", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ final_attraction: r.name, source_platform: "AI推荐" }),
                          });
                          fetchWorks();
                        } catch {
                          /* ignore */
                        }
                      }}
                      className="text-[11px] text-cyan-300 hover:text-cyan-200 font-medium"
                    >
                      + 添加到心愿单
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-10 py-16 text-center border-t border-white/5">
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/30 mb-4">ROUTATOUO · JOURNEY · 旅途</div>
        <div className="flex items-center justify-center gap-8 text-[11px] text-white/50">
          <Link href="/journals" className="hover:text-white/80 transition-colors flex items-center gap-1.5">
            <BookOpen size={12} /> 日记
          </Link>
          <Link href="/postcards" className="hover:text-white/80 transition-colors flex items-center gap-1.5">
            <Image size={12} /> 明信片
          </Link>
          <Link href="/dashboard" className="hover:text-white/80 transition-colors flex items-center gap-1.5">
            <BarChart3 size={12} /> 看板
          </Link>
          <Link href="/routes" className="hover:text-white/80 transition-colors flex items-center gap-1.5">
            <Route size={12} /> 路线
          </Link>
        </div>
        <p className="text-white/30 text-[11px] mt-6">v0.8 · Atlas Style + Liquid Cursor · AI-native Travel</p>
      </footer>

      {/* Modals */}
      {editingWork && <EditDrawer work={editingWork} onClose={() => setEditingWork(null)} onSave={handleSaveEdit} />}
      {showManualAdd && <ManualAddModal onClose={() => setShowManualAdd(false)} onSave={handleManualAdd} />}
      {viewingWork && <ImageViewer work={viewingWork} onClose={() => setViewingWork(null)} />}
      {resultWork && (
        <UploadResultModal
          work={resultWork}
          onContinue={() => {
            setResultWork(null);
            setUploadStatus("idle");
          }}
          onClose={() => {
            setResultWork(null);
            setUploadStatus("idle");
          }}
          onEdit={handleEditWork}
        />
      )}
      {journalWork && (
        <JournalEditor work={journalWork} onClose={() => setJournalWork(null)} onSaved={handleJournalSaved} />
      )}
    </div>
  );
}
