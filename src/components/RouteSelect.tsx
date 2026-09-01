"use client";

import { useState, useEffect } from "react";
import { X, Plus, Check, Loader2 } from "lucide-react";
import type { Work, Route } from "@/types";

const ROUTE_COLORS = ["#60a5fa", "#10b981", "#a855f7", "#f97316", "#ec4899", "#06b6d4"];

interface RouteSelectProps {
  work: Work;
  onClose: () => void;
}

export default function RouteSelect({ work, onClose }: RouteSelectProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [adding, setAdding] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/routes")
      .then((r) => r.json())
      .then((d) => setRoutes(d.routes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 检查一个 route 里是否已有这个 work
  const isInRoute = (route: Route) =>
    (route.items || []).some((item) => item.work_id === work.id);

  const toggleRoute = async (route: Route) => {
    setAdding((prev) => new Set(prev).add(route.id));
    try {
      if (isInRoute(route)) {
        await fetch(`/api/routes/${route.id}/items?work_id=${work.id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/routes/${route.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ work_id: work.id }),
        });
      }
      // 刷新
      const res = await fetch("/api/routes");
      const d = await res.json();
      setRoutes(d.routes || []);
    } catch { /* ignore */ }
    finally {
      setAdding((prev) => {
        const next = new Set(prev);
        next.delete(route.id);
        return next;
      });
    }
  };

  const createAndAdd = async () => {
    if (!newName.trim()) return;
    try {
      const colorIdx = routes.length % ROUTE_COLORS.length;
      const res = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: ROUTE_COLORS[colorIdx] }),
      });
      const d = await res.json();
      if (d.route) {
        await fetch(`/api/routes/${d.route.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ work_id: work.id }),
        });
        const r2 = await fetch("/api/routes");
        const d2 = await r2.json();
        setRoutes(d2.routes || []);
        setNewName("");
        setShowNew(false);
      }
    } catch { /* ignore */ }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-xs animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">加入路线</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-3 space-y-1 max-h-60 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          )}

          {!loading && showNew && (
            <div className="flex gap-2 mb-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createAndAdd()}
                placeholder="路线名称..."
                className="flex-1 px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={createAndAdd} disabled={!newName.trim()}
                className="px-2 py-1.5 bg-blue-600 text-white text-xs rounded-lg disabled:opacity-50">
                创建
              </button>
            </div>
          )}

          {!loading && routes.length === 0 && !showNew && (
            <p className="text-xs text-gray-400 text-center py-4">还没有路线</p>
          )}

          {routes.map((route) => {
            const included = isInRoute(route);
            const busy = adding.has(route.id);
            return (
              <button
                key={route.id}
                onClick={() => toggleRoute(route)}
                disabled={busy}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: route.color }} />
                <span className="flex-1 text-left text-gray-700 dark:text-gray-200">{route.name}</span>
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
                {included && !busy && <Check className="w-4 h-4 text-emerald-500" />}
              </button>
            );
          })}
        </div>

        <div className="px-3 pb-3">
          <button
            onClick={() => setShowNew(!showNew)}
            className="w-full flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            新建路线
          </button>
        </div>
      </div>
    </div>
  );
}
