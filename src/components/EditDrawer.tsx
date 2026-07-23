"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Work } from "@/types";

interface EditDrawerProps {
  work: Work;
  onClose: () => void;
  onSave: (work: Work) => void;
}

export default function EditDrawer({ work, onClose, onSave }: EditDrawerProps) {
  const [country, setCountry] = useState(work.final_country || work.ai_country || "");
  const [region, setRegion] = useState(work.final_region || work.ai_region || "");
  const [city, setCity] = useState(work.final_city || work.ai_city || "");
  const [attraction, setAttraction] = useState(work.final_attraction || work.ai_attraction || "");
  const [notes, setNotes] = useState(work.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!attraction && !city) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/works/${work.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, region, city, attraction, notes }),
      });

      if (!res.ok) throw new Error("保存失败");

      const data = await res.json();
      onSave(data.work);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* 抽屉 */}
      <div className="fixed inset-y-0 right-0 w-full sm:max-w-sm bg-white shadow-2xl z-50 animate-slide-in">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">编辑分类</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* AI 识别信息 */}
          {work.ai_country && !work.is_confirmed && (
            <div className="mx-5 mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-700 mb-1 font-medium">AI 识别结果</p>
              <p className="text-xs text-amber-600">
                {[work.ai_country, work.ai_region, work.ai_city, work.ai_attraction]
                  .filter(Boolean)
                  .join(" > ")}
              </p>
            </div>
          )}

          {/* Form */}
          <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                国家
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="如：中国"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                省 / 州
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="如：云南（可选）"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                城市
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="如：大理"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                景点
              </label>
              <input
                type="text"
                value={attraction}
                onChange={(e) => setAttraction(e.target.value)}
                placeholder="如：洱海"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                备注
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="预算、最佳季节、推荐理由…"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving || (!attraction && !city)}
              className="w-full py-2.5 bg-emerald-500 text-white rounded-xl font-medium text-sm hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "保存中…" : "保存分类"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
