"use client";

import { apiFetch } from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import { BookOpen, Trash2, Loader2, RefreshCw, Pencil, CalendarDays, Quote } from "lucide-react";
import type { Journal, Work } from "@/types";
import JournalEditor from "@/components/JournalEditor";
import PageShell, { EmptyBlock } from "@/components/PageShell";

interface JournalWithWork extends Journal {
  works?: Work | null;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function JournalsPage() {
  const [journals, setJournals] = useState<JournalWithWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingJournal, setEditingJournal] = useState<JournalWithWork | null>(null);
  const [regenId, setRegenId] = useState<string | null>(null);

  const fetchJournals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/journals");
      if (!res.ok) throw new Error("加载失败");
      const data = await res.json();
      setJournals(data.journals || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("删除这篇日记？")) return;
    await apiFetch(`/api/journals/${id}`, { method: "DELETE" });
    setJournals((prev) => prev.filter((j) => j.id !== id));
  };

  const handleRegenQuote = async (journal: JournalWithWork) => {
    if (!window.confirm("重新生成旅途印记？原来的会被覆盖。")) return;
    setRegenId(journal.id);
    try {
      const res = await apiFetch("/api/quotes", {
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
      await apiFetch(`/api/journals/${journal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote: newQuote }),
      });
      setJournals((prev) =>
        prev.map((j) => (j.id === journal.id ? { ...j, quote: newQuote } : j))
      );
    } catch {
      /* ignore */
    } finally {
      setRegenId(null);
    }
  };

  const handleJournalSaved = () => {
    setEditingJournal(null);
    fetchJournals();
  };

  const photoCount = journals.filter((j) => j.photo_url).length;

  return (
    <PageShell
      title="旅程记录"
      subtitle={
        loading
          ? "加载中…"
          : journals.length > 0
            ? `${journals.length} 篇日记 · ${photoCount} 张照片`
            : "还没有日记"
      }
      icon={<BookOpen className="h-[17px] w-[17px]" />}
    >
      {loading && (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-fg-3" />
        </div>
      )}

      {!loading && journals.length === 0 && (
        <EmptyBlock
          icon={<BookOpen className="h-5 w-5" />}
          title="还没有旅行日记"
          hint="把心愿卡片标记为「去过」，就能写下第一篇了"
        />
      )}

      {!loading && journals.length > 0 && (
        <div className="space-y-3">
          {journals.map((j, idx) => {
            const place =
              j.works?.final_attraction || j.works?.final_city || "未知地点";
            const region = [j.works?.final_country, j.works?.final_city]
              .filter(Boolean)
              .join(" · ");
            return (
              <article
                key={j.id}
                className="animate-rise-in overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-line-2"
                style={{
                  boxShadow: "var(--shadow-card)",
                  animationDelay: `${Math.min(idx, 8) * 40}ms`,
                }}
              >
                <div className="flex gap-3 p-3.5">
                  {/* 缩略图 */}
                  {j.photo_url ? (
                    <img
                      src={j.photo_url}
                      alt={place}
                      className="h-[76px] w-[76px] shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-xl bg-surface-2 text-fg-3">
                      <BookOpen className="h-5 w-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    {/* 标题行 */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-[14px] font-semibold leading-tight text-fg">
                          {place}
                        </h3>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-fg-3">
                          <CalendarDays className="h-3 w-3" />
                          <span>{formatDate(j.created_at)}</span>
                          {region && (
                            <>
                              <span className="text-line-2">·</span>
                              <span className="truncate">{region}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 操作 */}
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          onClick={() => setEditingJournal(j)}
                          className="rounded-lg p-1.5 text-fg-3 transition-colors hover:bg-surface-2 hover:text-brand"
                          title="编辑"
                          aria-label="编辑"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(j.id)}
                          className="rounded-lg p-1.5 text-fg-3 transition-colors hover:bg-danger-soft hover:text-danger"
                          title="删除"
                          aria-label="删除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 旅途印记 */}
                    {j.quote && (
                      <div className="group mt-2 flex items-start gap-1.5 rounded-lg bg-brand-soft/60 px-2.5 py-1.5">
                        <Quote className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
                        <p className="flex-1 text-[11px] italic leading-relaxed text-brand">
                          {j.quote}
                        </p>
                        <button
                          onClick={() => handleRegenQuote(j)}
                          disabled={regenId === j.id}
                          className="shrink-0 rounded p-0.5 text-brand opacity-0 transition-opacity hover:bg-brand/10 focus:opacity-100 group-hover:opacity-100 disabled:opacity-100"
                          title="重新生成旅途印记"
                          aria-label="重新生成旅途印记"
                        >
                          {regenId === j.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* 正文 */}
                    <p className="mt-2 line-clamp-3 text-[12.5px] leading-relaxed text-fg-2">
                      {j.content || (
                        <span className="italic text-fg-3">（没有写感受）</span>
                      )}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editingJournal && editingJournal.works && (
        <JournalEditor
          work={editingJournal.works}
          journal={editingJournal}
          onClose={() => setEditingJournal(null)}
          onSaved={handleJournalSaved}
        />
      )}
    </PageShell>
  );
}
