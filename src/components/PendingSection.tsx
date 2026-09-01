"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCheck,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Work } from "@/types";

interface PendingSectionProps {
  works: Work[];
  onConfirm: (work: Work) => void;
  onConfirmAll: (works: Work[]) => void;
  onEdit: (work: Work) => void;
  onDelete: (work: Work) => void;
  /** 批量删除：成功后父组件负责更新 works，返回是否成功 */
  onBulkDelete: (ids: string[]) => Promise<boolean>;
}

/**
 * 待确认专区：AI 识别后未经人工确认的卡片暂存处。
 * 确认（或编辑保存）后自动进入主网格的分类里。
 * 支持批量管理模式（复选框 + 批量删除）。
 */
export default function PendingSection({
  works,
  onConfirm,
  onConfirmAll,
  onEdit,
  onDelete,
  onBulkDelete,
}: PendingSectionProps) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (works.length === 0) return null;

  const allSelected = works.length > 0 && works.every((w) => selectedIds.has(w.id));
  const nothingSelected = selectedIds.size === 0;

  const toggleSelect = (work: Work) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(work.id)) next.delete(work.id);
      else next.add(work.id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) works.forEach((w) => next.delete(w.id));
      else works.forEach((w) => next.add(w.id));
      return next;
    });
  };

  const handleExitSelect = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (nothingSelected) return;
    const ok = await onBulkDelete([...selectedIds]);
    if (ok) handleExitSelect();
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-medium text-amber-300">
            待确认 <span className="text-white/50">({works.length})</span>
          </h3>
          <span className="hidden sm:inline text-[11px] text-white/35">
            识别结果未经人工确认，确认后自动分类
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => (selectMode ? handleExitSelect() : setSelectMode(true))}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              selectMode
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                : "border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {selectMode ? "完成" : "批量管理"}
          </button>
          <button
            onClick={() => onConfirmAll(works)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 transition-colors hover:bg-amber-500/20 active:scale-[0.98]"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            全部确认
          </button>
        </div>
      </div>

      {/* 批量操作条 */}
      {selectMode && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5">
          <span className="text-sm font-medium text-cyan-200">
            已选 {selectedIds.size} 张
          </span>
          <button
            onClick={handleSelectAll}
            className="text-xs text-white/70 hover:text-white transition-colors"
          >
            {allSelected ? "取消全选" : "全选"}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleDeleteSelected}
              disabled={nothingSelected}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                nothingSelected
                  ? "bg-white/5 text-white/30 cursor-not-allowed"
                  : "bg-red-500/20 text-red-300 hover:bg-red-500/30"
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" /> 删除选中
            </button>
            <button
              onClick={handleExitSelect}
              className="px-3 py-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
            >
              完成
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {works.map((work) => {
          const aiLocation = [
            work.ai_country,
            work.ai_region,
            work.ai_city,
            work.ai_attraction,
          ]
            .filter(Boolean)
            .join(" · ");
          const label = aiLocation || "未识别出地点";
          const isSelected = selectedIds.has(work.id);

          return (
            <div
              key={work.id}
              className={`group rounded-xl overflow-hidden border bg-white/5 transition-all ${
                selectMode
                  ? isSelected
                    ? "border-cyan-500 ring-2 ring-cyan-400/60 cursor-pointer"
                    : "border-white/15 cursor-pointer"
                  : "border-amber-500/25"
              }`}
              onClick={selectMode ? () => toggleSelect(work) : undefined}
            >
              {/* 图片 */}
              <div className="aspect-[4/3] bg-gray-800/60 relative overflow-hidden">
                {work.image_url ? (
                  <img
                    src={work.image_url}
                    alt={label}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/15">
                    <MapPin className="w-8 h-8" />
                  </div>
                )}

                {/* 管理模式：左上角复选框 */}
                {selectMode && (
                  <div
                    className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-cyan-500 border-cyan-500 text-white"
                        : "bg-white/85 border-white text-gray-300"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                )}
              </div>

              {/* AI 识别结果 */}
              <div className="p-2.5">
                <p className="text-[12px] font-medium text-white/90 truncate" title={label}>
                  {label}
                </p>
                <p className="text-[10px] text-white/35 mt-0.5 truncate">
                  {work.ai_country || "未识别国家"}
                  {work.source_platform ? ` · ${work.source_platform}` : ""}
                </p>
              </div>

              {/* 操作（管理模式隐藏防误触） */}
              {!selectMode && (
                <div className="flex border-t border-white/10 divide-x divide-white/10">
                  <button
                    onClick={() => onEdit(work)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    title="手动修改分类"
                  >
                    <Pencil className="h-3 w-3" /> 修改
                  </button>
                  <button
                    onClick={() => onConfirm(work)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] text-emerald-300/90 transition-colors hover:bg-emerald-500/15"
                    title="确认识别结果，进入分类"
                  >
                    <Check className="h-3 w-3" /> 确认
                  </button>
                  <button
                    onClick={() => onDelete(work)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] text-red-300/70 transition-colors hover:bg-red-500/15 hover:text-red-300"
                    title="删除这张卡片"
                  >
                    <Trash2 className="h-3 w-3" /> 删除
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
