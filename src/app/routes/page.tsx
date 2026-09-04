"use client";

import { apiFetch } from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Trash2, Loader2, GripVertical, Plus, X, Route as RouteIcon, ChevronDown } from "lucide-react";
import type { Route } from "@/types";
import RouteAddWorkModal from "@/components/RouteAddWorkModal";
import PageShell, { EmptyBlock, SectionTitle } from "@/components/PageShell";

// Leaflet 在 import 阶段就会访问 window，必须 ssr:false 避开预渲染。
// 否则 pnpm build 会在 /routes 的静态预渲染时炸 window is not defined。
const RouteMiniMap = dynamic(() => import("@/components/RouteMiniMap"), {
  ssr: false,
  loading: () => (
    <div
      className="h-[260px] w-full rounded-2xl border border-line bg-surface-2 animate-pulse-subtle"
      aria-label="地图加载中"
    />
  ),
});
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

function SortableItem({
  item,
  index,
  onRemove,
  removing,
}: {
  item: any;
  index: number;
  onRemove?: (workId: string) => void;
  removing?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const work = item.work;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-surface-2 ${
        isDragging ? "z-10 bg-surface-2 opacity-90" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab touch-none text-fg-3 transition-colors hover:text-fg-2 active:cursor-grabbing"
        title="拖动调整顺序"
        aria-label="拖动调整顺序"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <span className="w-4 shrink-0 text-center text-[10px] font-medium text-fg-3">
        {index + 1}
      </span>

      {work?.image_thumb ? (
        <img
          src={work.image_thumb}
          alt=""
          className="h-8 w-8 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-fg-3">
          <RouteIcon className="h-3.5 w-3.5" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-medium text-fg">
          {work?.final_attraction || work?.final_city || "?"}
        </p>
        <p className="truncate text-[10px] text-fg-3">
          {[work?.final_country, work?.final_city].filter(Boolean).join(" · ") ||
            "未识别地点"}
        </p>
      </div>

      {onRemove && (
        <button
          onClick={() => onRemove(item.work_id)}
          disabled={removing}
          className="shrink-0 rounded-md p-1 text-fg-3 transition-colors hover:bg-danger-soft hover:text-danger"
          title="从路线移除"
          aria-label="从路线移除"
        >
          {removing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [removingWorkId, setRemovingWorkId] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/routes");
      const d = await res.json();
      setRoutes(d.routes || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (route: Route) => {
    if (!window.confirm(`删除路线「${route.name}」？`)) return;
    await apiFetch(`/api/routes/${route.id}`, { method: "DELETE" });
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
    await apiFetch(`/api/routes/${routeId}/items/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: updateItems }),
    });
  };

  const handleRemove = async (routeId: string, workId: string) => {
    if (!window.confirm("把这个地点从路线中移除？")) return;
    setRemovingWorkId(workId);
    try {
      await apiFetch(`/api/routes/${routeId}/items?work_id=${workId}`, {
        method: "DELETE",
      });
      setRoutes((prev) =>
        prev.map((r) =>
          r.id === routeId
            ? { ...r, items: (r.items || []).filter((i) => i.work_id !== workId) }
            : r
        )
      );
    } catch {
      /* ignore */
    } finally {
      setRemovingWorkId(null);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const totalStops = routes.reduce((s, r) => s + (r.items?.length || 0), 0);

  return (
    <PageShell
      title="路线"
      subtitle={
        loading
          ? "加载中…"
          : routes.length > 0
            ? `${routes.length} 条路线 · 共 ${totalStops} 站`
            : "还没有路线"
      }
      icon={<RouteIcon className="h-[17px] w-[17px]" />}
    >
      {loading && (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-fg-3" />
        </div>
      )}

      {!loading && routes.length === 0 && (
        <EmptyBlock
          icon={<RouteIcon className="h-5 w-5" />}
          title="还没有路线"
          hint="在首页卡片上点 🗺️ 就能加入路线"
        />
      )}

      {!loading && routes.length > 0 && (
        <div className="space-y-6">
          {/* ── 路线总览地图 ─────────────────────────── */}
          <section>
            <SectionTitle icon={<RouteIcon className="h-4 w-4" />}>
              路线总览
            </SectionTitle>
            <RouteMiniMap routes={routes} height="260px" />
          </section>

          {/* ── 路线列表 ─────────────────────────────── */}
          <section>
            <SectionTitle
              aside={<span className="text-[11px] text-fg-3">点标题展开</span>}
            >
              我的路线
            </SectionTitle>

            <div className="space-y-3">
              {routes.map((route, rIdx) => {
                const items = (route.items || []).sort(
                  (a, b) => a.sort_order - b.sort_order
                );
                const expanded = expandedIds.has(route.id);

                return (
                  <div
                    key={route.id}
                    className="animate-rise-in overflow-hidden rounded-2xl border border-line bg-surface transition-colors"
                    style={{
                      boxShadow: "var(--shadow-card)",
                      animationDelay: `${Math.min(rIdx, 8) * 40}ms`,
                    }}
                  >
                    {/* 顶部色条 */}
                    <div
                      className="h-1 w-full"
                      style={{ background: route.color }}
                      aria-hidden
                    />

                    <button
                      onClick={() => toggleExpand(route.id)}
                      aria-expanded={expanded}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: route.color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-fg">
                        {route.name}
                      </span>
                      <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-fg-3">
                        {items.length} 站
                      </span>
                      <ChevronDown
                        className="h-4 w-4 shrink-0 text-fg-3 transition-transform duration-200"
                        style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
                      />
                    </button>

                    {expanded && (
                      <div className="border-t border-line px-3 py-2">
                        {items.length > 0 ? (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(e: DragEndEvent) => {
                              if (!e.over || e.active.id === e.over.id) return;
                              const oldIdx = items.findIndex((i) => i.id === e.active.id);
                              const newIdx = items.findIndex((i) => i.id === e.over!.id);
                              if (oldIdx >= 0 && newIdx >= 0)
                                handleReorder(route.id, oldIdx, newIdx);
                            }}
                          >
                            <SortableContext
                              items={items.map((i) => i.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-0.5">
                                {items.map((item, idx) => (
                                  <SortableItem
                                    key={item.id}
                                    item={item}
                                    index={idx}
                                    onRemove={(workId) => handleRemove(route.id, workId)}
                                    removing={removingWorkId === item.work_id}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        ) : (
                          <p className="py-3 text-center text-xs text-fg-3">
                            路线里还没有地点
                          </p>
                        )}

                        <button
                          onClick={() => setEditingRoute(route)}
                          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-2 py-2 text-xs font-medium text-fg-2 transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
                        >
                          <Plus className="h-3.5 w-3.5" /> 添加地点
                        </button>
                      </div>
                    )}

                    <div className="flex justify-end border-t border-line px-4 py-1.5">
                      <button
                        onClick={() => handleDelete(route)}
                        className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10px] text-fg-3 transition-colors hover:text-danger"
                      >
                        <Trash2 className="h-3 w-3" />
                        删除路线
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {editingRoute && (
        <RouteAddWorkModal
          route={editingRoute}
          onClose={() => setEditingRoute(null)}
          onAdded={() => {
            setEditingRoute(null);
            fetchRoutes();
          }}
        />
      )}
    </PageShell>
  );
}
