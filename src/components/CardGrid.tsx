"use client";

import { useState, useCallback } from "react";
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
import WorkCard from "./WorkCard";
import type { Work } from "@/types";
import { buildGroupTree } from "@/lib/grouping";
import { ChevronDown, ChevronRight, Earth, Map as MapIcon, Building2, GripVertical, List } from "lucide-react";

// 可排序的卡片包装
function SortableCard({ work, onEdit, onView, onStatusToggle, onDelete, onJournal, hasJournal }: {
  work: Work;
  onEdit: (w: Work) => void;
  onView: (w: Work) => void;
  onStatusToggle: (w: Work) => void;
  onDelete: (w: Work) => void;
  onJournal?: (w: Work) => void;
  hasJournal?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: work.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };
  return (
    <div ref={setNodeRef} style={style} className="relative">
      <button {...attributes} {...listeners} className="absolute top-1 right-1 z-10 p-0.5 rounded bg-white/80 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-grab active:cursor-grabbing">
        <GripVertical className="w-3.5 h-3.5 text-gray-400" />
      </button>
      <WorkCard work={work} onEdit={onEdit} onView={onView} onStatusToggle={onStatusToggle} onDelete={onDelete} onJournal={onJournal} hasJournal={hasJournal} />
    </div>
  );
}

interface CardGridProps {
  works: Work[];
  onEdit: (work: Work) => void;
  onView: (work: Work) => void;
  onStatusToggle: (work: Work) => void;
  onDelete: (work: Work) => void;
  onReorder?: (sortedWorks: Work[]) => void;
  onJournal?: (work: Work) => void;
  journalWorkIds?: Set<string>;
}

export default function CardGrid({ works, onEdit, onView, onStatusToggle, onDelete, onReorder, onJournal, journalWorkIds }: CardGridProps) {
  const [sortMode, setSortMode] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // 排序模式:所有作品按 sort_order 排列
  const sortedWorks = sortMode
    ? [...works].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : [];

  // 分组模式
  const tree = buildGroupTree(works);

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sortedWorks.findIndex((w) => w.id === active.id);
    const newIdx = sortedWorks.findIndex((w) => w.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove([...sortedWorks], oldIdx, newIdx);
    onReorder?.(reordered);
  }, [sortedWorks, onReorder]);

  return (
    <div className="space-y-4">
      {/* 排序模式切换 */}
      <div className="flex justify-end">
        <button
          onClick={() => setSortMode(!sortMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
            sortMode
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          <List className="w-3.5 h-3.5" />
          {sortMode ? "退出排序" : "调整排序"}
        </button>
      </div>

      {/* 排序模式:扁平可拖拽列表 */}
      {sortMode && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedWorks.map((w) => w.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
              {sortedWorks.map((work) => (
                <SortableCard
                  key={work.id}
                  work={work}
                  onEdit={onEdit}
                  onView={onView}
                  onStatusToggle={onStatusToggle}
                  onDelete={onDelete} onJournal={onJournal} hasJournal={journalWorkIds?.has(work.id)}
                />
              ))}
            </div>
            {sortedWorks.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">还没有作品,上传第一张截图吧</div>
            )}
          </SortableContext>
        </DndContext>
      )}

      {/* 分组模式:原来的分组视图 */}
      {!sortMode && (
        <div className="space-y-6">
          {tree.map((country) => {
            const isCountryCollapsed = collapsed.has(country.key);
            return (
              <div key={country.key} className="space-y-3">
                <button
                  onClick={() => toggle(country.key)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 text-sm font-medium hover:shadow-sm transition-all dark:from-blue-950 dark:to-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                >
                  <Earth className="w-4 h-4" />
                  <span className="flex-1 text-left">{country.label}</span>
                  <span className="text-xs opacity-60 tabular-nums">{country.count}</span>
                  {isCountryCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {!isCountryCollapsed && (
                  country.children.length > 0 ? (
                    <div className="space-y-4 pl-2">
                      {country.children.map((region) => (
                        <div key={region.key} className="space-y-2">
                          {region.children.length > 0 ? (
                            <>
                              <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400">
                                <MapIcon className="w-3.5 h-3.5" />{region.label}
                                <span className="text-purple-400 dark:text-purple-500">{region.count}</span>
                              </div>
                              <div className="space-y-3 pl-2">
                                {region.children.map((city) => (
                                  <div key={city.key} className="space-y-2">
                                    {city.children.length > 0 ? (
                                      <>
                                        <div className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                                          <Building2 className="w-3.5 h-3.5" />{city.label}
                                          <span className="text-amber-400 dark:text-amber-500">{city.count}</span>
                                        </div>
                                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                                          {city.children.flatMap((attr) =>
                                            attr.works.map((work) => (
                                              <WorkCard key={work.id} work={work} onEdit={onEdit} onView={onView} onStatusToggle={onStatusToggle} onDelete={onDelete} onJournal={onJournal} hasJournal={journalWorkIds?.has(work.id)} />
                                            ))
                                          )}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                                        {city.works.map((work) => (
                                          <WorkCard key={work.id} work={work} onEdit={onEdit} onView={onView} onStatusToggle={onStatusToggle} onDelete={onDelete} onJournal={onJournal} hasJournal={journalWorkIds?.has(work.id)} />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                              {region.works.map((work) => (
                                <WorkCard key={work.id} work={work} onEdit={onEdit} onView={onView} onStatusToggle={onStatusToggle} onDelete={onDelete} onJournal={onJournal} hasJournal={journalWorkIds?.has(work.id)} />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                      {country.works.map((work) => (
                        <WorkCard key={work.id} work={work} onEdit={onEdit} onView={onView} onStatusToggle={onStatusToggle} onDelete={onDelete} onJournal={onJournal} hasJournal={journalWorkIds?.has(work.id)} />
                      ))}
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
