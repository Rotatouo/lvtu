"use client";

import { Compass } from "lucide-react";

interface EmptyStateProps {
  onUploadClick: () => void;
}

export default function EmptyState({ onUploadClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
        <Compass className="w-10 h-10 text-emerald-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        还没有收藏任何地方
      </h2>
      <p className="text-gray-400 text-sm text-center max-w-xs mb-8">
        上传你在抖音、小红书刷到的旅行截图，
        <br />
        AI 帮你按国家、城市、景点自动整理
      </p>
      <button
        onClick={onUploadClick}
        className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
      >
        上传第一张截图
      </button>
    </div>
  );
}
