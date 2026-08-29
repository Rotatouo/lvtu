"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Plus, Loader2, MapPin } from "lucide-react";
import type { Work, Route } from "@/types";

interface RouteAddWorkModalProps {
  route: Route;
  onClose: () => void;
  onAdded: () => void;
}

export default function RouteAddWorkModal({ route, onClose, onAdded }: RouteAddWorkModalProps) {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/works")
      .then((r) => r.json())
      .then((d) => setWorks(d.works || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const itemWorkIds = useMemo(
    () => new Set((route.items || []).map((i) => i.work_id)),
    [route.items]
  );

  const candidates = useMemo(
    () =>
      works
        .filter((w) => !itemWorkIds.has(w.id))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [works, itemWorkIds]
  );

  const displayLabel = (w: Work) =>
    w.final_attraction || w.final_city || w.final_region || w.final_country || "未知地点";

  const add = async (work: Work) => {
    setAdding((prev) => new Set(prev).add(work.id));
    try {
      await fetch(`/api/routes/${route.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ work_id: work.id }),
      });
      onAdded();
    } catch {
      // ignore
    } finally {
      setAdding((prev) => {
        const next = new Set(prev);
        next.delete(work.id);
        return next;
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-sm animate-scale-in flex-col overflow-hidden rounded-2xl border border-line bg-surface"
        style={{ boxShadow: "var(--shadow-pop)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部带路线色条 */}
        <div className="h-1 w-full shrink-0" style={{ background: route.color }} />

        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="truncate pr-2 text-[13px] font-semibold text-fg">
            添加到「{route.name}」
          </h3>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-fg-3" />
            </div>
          )}

          {!loading && candidates.length === 0 && (
            <div className="py-10 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 text-fg-3">
                <MapPin className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-fg-2">没有可添加的心愿</p>
              <p className="mt-1 text-[11px] text-fg-3">所有景点都已在这条路线里</p>
            </div>
          )}

          {candidates.map((w) => {
            const busy = adding.has(w.id);
            return (
              <button
                key={w.id}
                onClick={() => add(w)}
                disabled={busy}
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-surface-2 disabled:opacity-60"
              >
                {w.image_thumb ? (
                  <img
                    src={w.image_thumb}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-fg-3">
                    <MapPin className="h-4 w-4" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-fg">
                    {displayLabel(w)}
                  </span>
                  <span className="block truncate text-[10px] text-fg-3">
                    {[w.final_country, w.final_city].filter(Boolean).join(" · ") ||
                      "未识别地点"}
                  </span>
                </span>
                {busy ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-fg-3" />
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
