"use client";

import { useState } from "react";
import { X, MapPinPlus } from "lucide-react";
import type { Work } from "@/types";

interface ManualAddModalProps {
  onClose: () => void;
  onSave: (work: Work) => void;
}

export default function ManualAddModal({ onClose, onSave }: ManualAddModalProps) {
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [attraction, setAttraction] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!attraction && !city) return;

    setSaving(true);
    try {
      const res = await fetch("/api/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, region, city, attraction }),
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
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <MapPinPlus className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold text-gray-800">手动添加</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="px-5 py-4 space-y-3">
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="国家 · 如：中国"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="省/州 · 如：云南（可选）"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="城市 · 如：大理"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <input
              type="text"
              value={attraction}
              onChange={(e) => setAttraction(e.target.value)}
              placeholder="景点 · 如：洱海"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving || (!attraction && !city)}
              className="w-full py-2.5 bg-emerald-500 text-white rounded-xl font-medium text-sm hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "添加中…" : "添加到心愿单"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
