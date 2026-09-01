"use client";

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
}

/**
 * 待确认专区：AI 识别后未经人工确认的卡片暂存处。
 * 确认（或编辑保存）后自动进入主网格的分类里。
 */
export default function PendingSection({
  works,
  onConfirm,
  onConfirmAll,
  onEdit,
  onDelete,
}: PendingSectionProps) {
  if (works.length === 0) return null;

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
        <button
          onClick={() => onConfirmAll(works)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 transition-colors hover:bg-amber-500/20 active:scale-[0.98]"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          全部确认
        </button>
      </div>

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

          return (
            <div
              key={work.id}
              className="group rounded-xl overflow-hidden border border-amber-500/25 bg-white/5"
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

              {/* 操作：修改 / 确认 / 删除 */}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
