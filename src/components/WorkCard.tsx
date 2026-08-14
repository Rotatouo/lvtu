"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Heart, CheckCircle2, Trash2, BookOpen, Route } from "lucide-react";
import RouteSelect from "./RouteSelect";
import type { Work } from "@/types";

interface WorkCardProps {
  work: Work;
  onEdit: (work: Work) => void;
  onView: (work: Work) => void;
  onStatusToggle: (work: Work) => void;
  onDelete: (work: Work) => void;
  onJournal?: (work: Work) => void;
  hasJournal?: boolean;
}

export default function WorkCard({ work, onEdit, onView, onStatusToggle, onDelete, onJournal, hasJournal }: WorkCardProps) {
  const [showRoutes, setShowRoutes] = useState(false);
  const displayLabel =
    work.final_attraction ||
    work.final_city ||
    work.final_region ||
    work.final_country ||
    "未知地点";

  const subLabel = [
    work.final_country,
    work.final_region,
    work.final_city,
  ]
    .filter(Boolean)
    .join(" · ");

  const isBeenThere = work.status === "been_there";

  return (
    <>
      <div
        className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.98] transition-transform duration-150 cursor-pointer touch-manipulation"
        onClick={() => onView(work)}
        role="button"
        tabIndex={0}
      >
      {/* 图片 */}
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        {work.image_url ? (
          <Image
            alt={displayLabel}
            className="w-full h-full object-cover"
            fill
            loading="lazy"
            sizes="(max-width: 640px) 50vw, 20vw"
            src={work.image_url}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <MapPin className="w-12 h-12" />
          </div>
        )}

        {/* 状态角标 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusToggle(work);
          }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm transition-all active:scale-110 touch-manipulation ${
            isBeenThere
              ? "bg-emerald-500/90 text-white"
              : "bg-white/80 text-gray-400 hover:text-rose-500"
          }`}
          title={isBeenThere ? "标记为想去" : "标记为去过"}
          aria-label={isBeenThere ? "标记为想去" : "标记为去过"}
        >
          {isBeenThere ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Heart className="w-4 h-4" />
          )}
        </button>

        {/* 地名浮层（移动端常显） */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-white text-xs font-medium truncate">{displayLabel}</p>
        </div>
      </div>

      {/* 信息栏 */}
      <div className="p-2.5 sm:p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-800 text-xs sm:text-sm truncate">
              {displayLabel}
            </p>
            {subLabel && (
              <p className="text-[11px] sm:text-xs text-gray-400 truncate mt-0.5">
                {subLabel}
              </p>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(work);
            }}
            className="flex-shrink-0 p-1.5 sm:p-1 rounded-lg text-gray-400 active:text-emerald-600 active:bg-emerald-50 transition-colors touch-manipulation"
            title="编辑分类"
            aria-label="编辑分类"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(work);
            }}
            className="flex-shrink-0 p-1.5 sm:p-1 rounded-lg text-gray-400 active:text-red-500 active:bg-red-50 transition-colors touch-manipulation"
            title="删除"
            aria-label="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {onJournal && isBeenThere && (
            <button
              onClick={(e) => { e.stopPropagation(); onJournal(work); }}
              className={`flex-shrink-0 p-1.5 sm:p-1 rounded-lg transition-colors touch-manipulation ${
                hasJournal
                  ? "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                  : "text-purple-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30"
              }`}
              title={hasJournal ? "查看日记" : "写日记"}
              aria-label={hasJournal ? "查看日记" : "写日记"}
            >
              <BookOpen className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setShowRoutes(true); }}
            className="flex-shrink-0 p-1.5 sm:p-1 rounded-lg text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors touch-manipulation"
            title="加入路线"
            aria-label="加入路线"
          >
            <Route className="w-4 h-4" />
          </button>
        </div>

        {/* 状态标签 */}
        <div className="flex items-center gap-1.5 mt-1.5">
          {work.is_confirmed && (
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              已确认
            </span>
          )}
          {!work.is_confirmed && work.ai_country && (
            <span className="text-[10px] text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">
              待确认
            </span>
          )}
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            isBeenThere
              ? "text-emerald-600 bg-emerald-50"
              : "text-gray-400 bg-gray-50"
          }`}>
            {isBeenThere ? "去过" : "想去"}
          </span>
        </div>
      </div>
    </div>
    {showRoutes && <RouteSelect work={work} onClose={() => setShowRoutes(false)} />}
    </>
  );
}
