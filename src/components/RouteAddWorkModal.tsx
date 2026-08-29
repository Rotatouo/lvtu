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
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm max-h-[80vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            添加地点到「{route.name}」
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          )}

          {!loading && candidates.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              <p>没有可添加的心愿</p>
              <p className="text-xs mt-1 opacity-70">所有景点都已在这条路线里</p>
            </div>
          )}

          {candidates.map((w) => {
            const busy = adding.has(w.id);
            return (
              <button
                key={w.id}
                onClick={() => add(w)}
                disabled={busy}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 text-left transition-colors"
              >
                {w.image_thumb ? (
                  <img src={w.image_thumb} alt="" className="w-8 h-8 object-cover rounded shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-200 truncate">{displayLabel(w)}</p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {[w.final_country, w.final_city].filter(Boolean).join(" · ") || "未识别地点"}
                  </p>
                </div>
                {busy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                ) : (
                  <Plus className="w-4 h-4 text-blue-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
