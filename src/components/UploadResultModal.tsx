"use client";

import { CheckCircle, Upload, MapPin, Pencil } from "lucide-react";
import type { Work } from "@/types";

interface UploadResultModalProps {
  work: Work;
  onContinue: () => void;
  onClose: () => void;
  onEdit?: (work: Work) => void;
}

export default function UploadResultModal({ work, onContinue, onClose, onEdit }: UploadResultModalProps) {

  const location = [
    work.ai_country || work.final_country,
    work.ai_region || work.final_region,
    work.ai_city || work.final_city,
    work.ai_attraction || work.final_attraction,
  ].filter(Boolean).join(" · ");

  const hasResult = !!location;

  const handleEdit = () => {
    onClose();
    onEdit?.(work);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full sm:max-w-sm animate-scale-in">
          <div className="flex flex-col items-center pt-8 pb-4 px-6">
            {hasResult ? (
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-3">
                <Upload className="w-8 h-8 text-amber-500" />
              </div>
            )}

            <h3 className="text-lg font-semibold text-gray-800">
              {hasResult ? "AI 识别结果" : "已上传"}
            </h3>

            {hasResult ? (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
                <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500 text-center">
                AI 暂未识别出地点
              </p>
            )}

            <p className="mt-2 text-xs text-gray-400">
              {hasResult ? "识别有误或想补全信息？" : "你可以手动编辑分类信息"}
            </p>
          </div>

          <div className="p-4 pt-0 flex gap-2">
            <button
              onClick={handleEdit}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm active:bg-gray-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              手动修改
            </button>
            <button
              onClick={onContinue}
              className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-medium text-sm active:bg-emerald-600 transition-colors"
            >
              就这样
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
