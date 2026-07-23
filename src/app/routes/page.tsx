"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Loader2, GripVertical } from "lucide-react";
import type { Route } from "@/types";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableItem({ item, route }: { item: any; route: Route }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const work = item.work;
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-1.5">
      <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab">
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      {work?.image_thumb && <img src={work.image_thumb} alt="" className="w-8 h-8 object-cover rounded" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-700 dark:text-gray-200 truncate">
          {work?.final_attraction || work?.final_city || "?"}
        </p>
        <p className="text-[10px] text-gray-400">
          {[work?.final_country, work?.final_city].filter(Boolean).join(" · ")}
        </p>
      </div>
    </div>
  );
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/routes");
      const d = await res.json();
      setRoutes(d.routes || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  const handleDelete = async (route: Route) => {
    if (!window.confirm(`删除路线「${route.name}」?`)) return;
    await fetch(`/api/routes/${route.id}`, { method: "DELETE" });
    setRoutes((prev) => prev.filter((r) => r.id !== route.id));
  };

  const handleReorder = async (routeId: string, oldIdx: number, newIdx: number) => {
    const route = routes.find((r) => r.id === routeId);
    if (!route) return;
    const items = [...(route.items || [])].sort((a, b) => a.sort_order - b.sort_order);
    const reordered = arrayMove(items, oldIdx, newIdx);
    const updateItems = reordered.map((item, i) => ({ id: item.id, sort_order: i }));
    setRoutes((prev) =>
      prev.map((r) =>
        r.id === routeId
          ? { ...r, items: reordered.map((item, i) => ({ ...item, sort_order: i })) }
          : r
      )
    );
    await fetch(`/api/routes/${routeId}/items/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: updateItems }),
    });
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="p-1 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">路线</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {loading && (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        )}

        {!loading && routes.length === 0 && (
          <div className="text-center py-20 space-y-1">
            <p className="text-gray-400 text-sm">还没有路线</p>
            <p className="text-gray-300 text-xs">在卡片上点 🗺️ 加入路线</p>
          </div>
        )}

        {routes.map((route) => {
          const items = (route.items || []).sort((a, b) => a.sort_order - b.sort_order);
          const expanded = expandedId === route.id;
          return (
            <div key={route.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setExpandedId(expanded ? null : route.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: route.color }} />
                <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">{route.name}</span>
                <span className="text-[11px] text-gray-400">{items.length} 个地点</span>
              </button>

              {expanded && items.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e: DragEndEvent) => {
                      if (!e.over || e.active.id === e.over.id) return;
                      const oldIdx = items.findIndex((i) => i.id === e.active.id);
                      const newIdx = items.findIndex((i) => i.id === e.over!.id);
                      if (oldIdx >= 0 && newIdx >= 0) handleReorder(route.id, oldIdx, newIdx);
                    }}
                  >
                    <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                      {items.map((item) => (
                        <SortableItem key={item.id} item={item} route={route} />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              <div className="flex justify-end border-t border-gray-100 dark:border-gray-700 px-4 py-2">
                <button onClick={() => handleDelete(route)}
                  className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3 h-3" />删除
                </button>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
