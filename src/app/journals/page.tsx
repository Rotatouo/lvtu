"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Trash2, Loader2, RefreshCw, Pencil } from "lucide-react";
import type { Journal, Work } from "@/types";
import JournalEditor from "@/components/JournalEditor";

interface JournalWithWork extends Journal {
  works?: Work | null;
}

export default function JournalsPage() {
  const [journals, setJournals] = useState<JournalWithWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingJournal, setEditingJournal] = useState<JournalWithWork | null>(null);

  const loadJournals = useCallback(async (): Promise<JournalWithWork[]> => {
    const res = await fetch("/api/journals");
    if (!res.ok) throw new Error("加载失败");
    const data: { journals?: JournalWithWork[] } = await res.json();
    return data.journals || [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchJournals() {
      try {
        const nextJournals = await loadJournals();
        if (!cancelled) setJournals(nextJournals);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchJournals();
    return () => {
      cancelled = true;
    };
  }, [loadJournals]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("删除这篇日记?")) return;
    await fetch(`/api/journals/${id}`, { method: "DELETE" });
    setJournals((prev) => prev.filter((j) => j.id !== id));
  };

  const handleRegenQuote = async (journal: JournalWithWork) => {
    if (!window.confirm("重新生成旅途印记?原来的会被覆盖。")) return;
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attraction: journal.works?.final_attraction || "",
          city: journal.works?.final_city || "",
          country: journal.works?.final_country || "",
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const newQuote = data.quotes?.[0] || "";
      await fetch(`/api/journals/${journal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote: newQuote }),
      });
      setJournals((prev) => prev.map((j) => j.id === journal.id ? { ...j, quote: newQuote } : j));
    } catch { /* ignore */ }
  };

  const handleJournalSaved = () => {
    setEditingJournal(null);
    setLoading(true);
    loadJournals()
      .then(setJournals)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="p-1 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">旅行日记</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {!loading && journals.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 dark:text-gray-500 text-sm">还没有旅行日记</p>
            <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">标记一个&quot;去过&quot;的地点来写第一篇吧!</p>
          </div>
        )}

        {!loading && journals.length > 0 && (
          <div className="space-y-3">
            {journals.map((j) => (
              <div key={j.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {j.works && (j.works.final_attraction || j.works.final_city || "未知地点")}
                      </span>
                      {j.visited_at && (
                        <span className="text-[11px] text-gray-400">
                          {j.visited_at}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-300">
                        {new Date(j.created_at).toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </div>
                    {j.quote && (
                      <div className="flex items-start gap-1 group mb-1.5">
                        <p className="text-xs text-purple-600 dark:text-purple-400 italic">&quot;{j.quote}&quot;</p>
                        <button onClick={() => handleRegenQuote(j)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-purple-50 dark:hover:bg-purple-900/30 text-purple-400 shrink-0 transition-opacity"
                          title="重新生成">
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                      {j.content || <span className="text-gray-300 italic">(没有写感受)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditingJournal(j)} className="p-1 text-gray-300 hover:text-blue-500" title="编辑">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(j.id)} className="p-1 text-gray-300 hover:text-red-500" title="删除">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {j.photo_url && (
                  <Image src={j.photo_url} alt="" width={768} height={144} unoptimized loading="eager" className="mt-3 w-full h-36 object-cover rounded-lg" />
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {editingJournal && editingJournal.works && (
        <JournalEditor
          work={editingJournal.works}
          journal={editingJournal}
          onClose={() => setEditingJournal(null)}
          onSaved={handleJournalSaved}
        />
      )}
    </div>
  );
}
