"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Compass, Plus, Search, X, LayoutGrid, Map, Moon, Sun, BookOpen, BarChart3, Image, Sparkles, Route } from "lucide-react";
import Link from "next/link";
import type { Work, UploadStatus, Route as RouteType } from "@/types";
import UploadZone from "@/components/UploadZone";
import CardGrid from "@/components/CardGrid";
import EditDrawer from "@/components/EditDrawer";
import ManualAddModal from "@/components/ManualAddModal";
import ImageViewer from "@/components/ImageViewer";
import EmptyState from "@/components/EmptyState";
import UploadResultModal from "@/components/UploadResultModal";
import JournalEditor from "@/components/JournalEditor";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function Home() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
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
  const [darkMode, setDarkMode] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{ id: string; label: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("lvtu-dark");
    if (saved === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("lvtu-dark", String(next));
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  const filteredWorks = useMemo(() => {
    if (!searchQuery.trim()) return works;
    const q = searchQuery.toLowerCase();
    return works.filter((w) => {
      const fields = [w.final_country, w.final_region, w.final_city, w.final_attraction, w.ai_country, w.ai_region, w.ai_city, w.ai_attraction];
      return fields.some((f) => f?.toLowerCase().includes(q));
    });
  }, [works, searchQuery]);

  const fetchWorks = useCallback(async () => {
    try {
      const res = await fetch("/api/works");
      const data = await res.json();
      if (data.works) setWorks(data.works);
    } catch (err) {
      console.error("Fetch works error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorks();
    // 加载日记 ID 列表和推荐
    fetch("/api/journals").then(r => r.json()).then(d => {
      const ids = new Set<string>((d.journals || []).map((j: any) => j.work_id));
      setJournalIds(ids);
    }).catch(() => {});
    fetch("/api/recommend").then(r => r.json()).then(d => {
      setRecs(d.recommendations || []);
    }).catch(() => {});
    fetch("/api/routes").then(r => r.json()).then(d => {
      setRoutes(d.routes || []);
    }).catch(() => {});
  }, [fetchWorks]);

  const handleUploadStart = (count: number) => {
    setUploadStatus("uploading");
    setUploadProgress({ current: 0, total: count });
  };

  const handleUploadComplete = (work: Work) => {
    setWorks((prev) => [work, ...prev]);
    setUploadProgress((p) => ({ ...p, current: p.current + 1 }));
    setUploadStatus("done");
    setResultWork(work);
  };

  const handleUploadError = (error: string) => {
    setUploadStatus("error");
    console.error(error);
    setTimeout(() => setUploadStatus("idle"), 3000);
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
    if (!window.confirm(`确定删除「${label}」？相关的日记和明信片将保留。`)) return;
    setWorks((prev) => prev.filter((w) => w.id !== work.id));
    try {
      await fetch(`/api/works/${work.id}`, { method: "DELETE" });
      fetchWorks();
    } catch (err) {
      console.error("Delete error:", err);
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
    } catch (err) {
      console.error("Status toggle error:", err);
    }
  };

  const handleOpenJournal = (work: Work) => setJournalWork(work);

  const handleJournalSaved = () => {
    setJournalWork(null);
    fetchWorks();
  };

  const handleReorder = async (sortedWorks: Work[]) => {
    setWorks(sortedWorks);
    const items = sortedWorks.map((w, i) => ({ id: w.id, sort_order: i }));
    try {
      await fetch("/api/works/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
    } catch (err) {
      console.error("Reorder error:", err);
    }
  };

  // 截获 UploadZone 完成事件,检测重复
  const handleUploadResult = (work: Work) => {
    if ((work as any)._duplicate) {
      const label = work.final_attraction || work.ai_attraction || "未知";
      if (window.confirm(`已收录此目的地「${label}」，是否仍要添加？`)) {
        handleUploadComplete(work);
      } else {
        setUploadStatus("idle");
      }
    } else {
      handleUploadComplete(work);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const showEmpty = works.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 dark:text-gray-100">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">旅途</h1>
            {!showEmpty && (
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 ml-1">
                <button onClick={() => setViewMode("card")} className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${viewMode === "card" ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
                  <LayoutGrid className="w-3 h-3" />卡片
                </button>
                <button onClick={() => setViewMode("map")} className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${viewMode === "map" ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
                  <Map className="w-3 h-3" />地图
                </button>
              </div>
            )}
            {/* v0.4 导航 */}
            {!showEmpty && (
              <div className="hidden sm:flex items-center gap-1 ml-3">
                <Link href="/journals" className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <BookOpen className="w-3 h-3" />日记
                </Link>
                <Link href="/postcards" className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Image className="w-3 h-3" />明信片
                </Link>
                <Link href="/dashboard" className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <BarChart3 className="w-3 h-3" />我的旅程
                </Link>
                <Link href="/routes" className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Route className="w-3 h-3" />路线
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleDarkMode} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation" title={darkMode ? "浅色模式" : "深色模式"}>
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => setShowManualAdd(true)} className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 active:text-emerald-600 active:bg-emerald-50 dark:active:bg-emerald-900 rounded-xl transition-colors touch-manipulation">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />手动添加
            </button>
          </div>
        </div>
      </header>

      <main className={viewMode === "map" ? "h-[calc(100vh-57px)]" : "max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6"}>
        {viewMode === "card" && (
          <>
            <UploadZone onUploadStart={handleUploadStart} onUploadComplete={handleUploadResult} onUploadError={handleUploadError} status={uploadStatus} />
            {uploadStatus === "uploading" && uploadProgress.total > 1 && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-300">
                📤 正在上传 {uploadProgress.current + 1}/{uploadProgress.total}…
              </div>
            )}
            {uploadStatus === "error" && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">上传失败，请重试。</div>
            )}
            {!showEmpty && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索国家、城市、景点…" className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            {showEmpty ? (
              <EmptyState onUploadClick={() => {}} />
            ) : (
              <CardGrid works={filteredWorks} onEdit={handleEditWork} onView={handleViewWork} onStatusToggle={handleStatusToggle} onDelete={handleDeleteWork} onReorder={handleReorder} onJournal={handleOpenJournal} journalWorkIds={journalIds} />
            )}
            {/* AI 推荐 */}
            {!showEmpty && recs.length > 0 && (
              <div className="mt-8 mb-4">
                <h3 className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI 推荐目的地
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {recs.map((r) => (
                    <div key={r.name} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 min-w-[180px] shrink-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.name}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 mb-3">{r.reason}</p>
                      <button
                        onClick={async () => {
                          try {
                            await fetch("/api/works", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ final_attraction: r.name, source_platform: "AI推荐" }),
                            });
                            fetchWorks();
                          } catch { /* ignore */ }
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                      >
                        + 添加到心愿单
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {viewMode === "map" && <MapView works={works} routes={routes} onSelectWork={handleViewWork} />}
      </main>

      {editingWork && <EditDrawer work={editingWork} onClose={() => setEditingWork(null)} onSave={handleSaveEdit} />}
      {showManualAdd && <ManualAddModal onClose={() => setShowManualAdd(false)} onSave={handleManualAdd} />}
      {viewingWork && <ImageViewer work={viewingWork} onClose={() => setViewingWork(null)} />}
      {resultWork && (
        <UploadResultModal work={resultWork} onContinue={() => { setResultWork(null); setUploadStatus("idle"); }} onClose={() => { setResultWork(null); setUploadStatus("idle"); }} onEdit={handleEditWork} />
      )}
      {journalWork && (
        <JournalEditor work={journalWork} onClose={() => setJournalWork(null)} onSaved={handleJournalSaved} />
      )}
    </div>
  );
}
