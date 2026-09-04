"use client";

import { apiFetch } from "@/lib/api";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, Sparkles, Loader2, Camera, Check, Save, RefreshCw } from "lucide-react";
import type { Work, Journal } from "@/types";

const HOLIDAYS = ["春节","五一","国庆","中秋","元旦","端午","七夕","清明","重阳","圣诞","跨年"];

type TimeMode = "date" | "yearMonth" | "monthOnly" | "holiday" | "none";

interface JournalEditorProps {
  work: Work;
  onClose: () => void;
  onSaved: () => void;
  journal?: Journal | null;
}

export default function JournalEditor({ work, onClose, onSaved, journal }: JournalEditorProps) {
  const [quotes, setQuotes] = useState<string[]>([]);
  const [quoteInput, setQuoteInput] = useState(journal?.quote || "");
  const [content, setContent] = useState(journal?.content || "");
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(journal?.photo_url || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // 时间 - 从已有日记恢复
  const initVisitedAt = journal?.visited_at || "";
  const initTimeMode: TimeMode = initVisitedAt.includes("年") && HOLIDAYS.some(h => initVisitedAt.includes(h)) ? "holiday"
    : initVisitedAt.match(/^\d{4}-\d{2}-\d{2}/) ? "date"
    : initVisitedAt.includes("月") && !initVisitedAt.includes("-") ? "monthOnly"
    : journal ? "none" : "date";

  const [timeMode, setTimeMode] = useState<TimeMode>(initTimeMode);
  const [exactDate, setExactDate] = useState(initVisitedAt.match(/^\d{4}-\d{2}-\d{2}/) ? initVisitedAt.slice(0,10) : new Date().toISOString().slice(0,10));
  const [yearMonth, setYearMonth] = useState(initVisitedAt.match(/^\d{4}-\d{2}/) ? initVisitedAt.slice(0,7) : new Date().toISOString().slice(0,7));
  const [monthOnly, setMonthOnly] = useState(String(new Date().getMonth() + 1));
  const [holiday, setHoliday] = useState(initTimeMode === "holiday" ? HOLIDAYS.find(h => initVisitedAt.includes(h)) || "" : "");
  const [holidayYear, setHolidayYear] = useState(initVisitedAt.match(/^\d{4}/) ? parseInt(initVisitedAt.match(/^\d{4}/)![0]) : new Date().getFullYear());
  const [toast, setToast] = useState("");
  const [draftRestored, setDraftRestored] = useState(false);

  const label = work.final_attraction || work.final_city || work.final_country || "未知";
  const location = [work.final_country, work.final_region, work.final_city].filter(Boolean).join(", ");
  const draftKey = `journal-draft-${work.id}`;

  // 加载 AI 文艺句
  useEffect(() => {
    let cancelled = false;
    async function fetchQuotes() {
      try {
        const res = await apiFetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attraction: work.final_attraction || "",
            city: work.final_city || "",
            country: work.final_country || "",
          }),
        });
        if (!res.ok) throw new Error("生成失败");
        const data = await res.json();
        if (!cancelled) setQuotes(data.quotes || []);
      } catch {
        if (!cancelled) setQuotes([]);
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }
    fetchQuotes();
    return () => { cancelled = true; };
  }, [work]);

  // 恢复草稿
  useEffect(() => {
    try {
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        const d = JSON.parse(draft);
        if (d.quoteInput) setQuoteInput(d.quoteInput);
        if (d.content) setContent(d.content);
        if (d.timeMode) setTimeMode(d.timeMode);
        if (d.exactDate) setExactDate(d.exactDate);
        if (d.yearMonth) setYearMonth(d.yearMonth);
        if (d.monthOnly) setMonthOnly(d.monthOnly);
        if (d.holiday) setHoliday(d.holiday);
        setDraftRestored(true);
      }
    } catch { /* ignore */ }
  }, [draftKey]);

  const handleSaveDraft = () => {
    localStorage.setItem(draftKey, JSON.stringify({
      quoteInput, content, timeMode, exactDate, yearMonth, monthOnly, holiday,
    }));
    setToast("草稿已保存 ✅");
    setTimeout(() => setToast(""), 2000);
  };

  const clearDraft = () => localStorage.removeItem(draftKey);

  // 重新生成旅途印记
  const regenQuotes = async () => {
    setQuoteLoading(true);
    try {
      const res = await apiFetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attraction: work.final_attraction || "",
          city: work.final_city || "",
          country: work.final_country || "",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.quotes || []);
      }
    } catch { /* ignore */ }
    finally { setQuoteLoading(false); }
  };

  const buildVisitedAt = (): string | null => {
    switch (timeMode) {
      case "date": return exactDate || null;
      case "yearMonth": return yearMonth ? `${yearMonth}月` : null;
      case "monthOnly": return monthOnly ? `${monthOnly}月` : null;
      case "holiday": return holiday ? `${holidayYear}年${holiday}` : null;
      case "none": return null;
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("prefix", "journals");
      const res = await apiFetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) setPhotoUrl(data.url);
    } catch { /* ignore */ }
    finally { setUploadingPhoto(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handlePhotoUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = journal ? `/api/journals/${journal.id}` : "/api/journals";
      const method = journal ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          work_id: work.id,
          content: content || "",
          quote: quoteInput || null,
          photo_url: photoUrl,
          visited_at: buildVisitedAt(),
        }),
      });
      if (!res.ok) throw new Error("保存失败");
      clearDraft();
      onSaved();
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-scale-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">你回来了 ✨</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label} · {location}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Toast */}
          {toast && (
            <div className="text-center py-1.5 px-3 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg animate-scale-in">
              {toast}
            </div>
          )}
          {/* 旅途印记 */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              旅途印记
              {draftRestored && (
                <span className="text-[10px] text-amber-500 ml-1">草稿已恢复</span>
              )}
              <button onClick={regenQuotes} disabled={quoteLoading} className="ml-auto p-0.5 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-400 hover:text-purple-600 disabled:opacity-30" title="重新生成">
                <RefreshCw className={`w-3.5 h-3.5 ${quoteLoading ? "animate-spin" : ""}`} />
              </button>
            </label>
            {quoteLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                正在为「{label}」生成...
              </div>
            )}
            {!quoteLoading && quotes.length > 0 && (
              <div className="space-y-2">
                {quotes.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQuoteInput(q)}
                    className={`w-full text-left p-2.5 rounded-lg text-sm border transition-colors ${
                      quoteInput === q
                        ? "border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-200"
                        : "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {!quoteLoading && (
              <input
                value={quoteInput}
                onChange={(e) => setQuoteInput(e.target.value)}
                placeholder="让 AI 为你写一句旅途印记..."
                className="w-full px-3 py-2 mt-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white italic placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            )}
          </div>

          {/* 我的感受 */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">我的感受</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下此刻的感受..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder:text-gray-400"
            />
          </div>

          {/* 时间 */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">什么时候去的?</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(["date","yearMonth","monthOnly","holiday","none"] as TimeMode[]).map((m) => {
                const labels: Record<TimeMode, string> = { date:"日期", yearMonth:"年月", monthOnly:"仅月份", holiday:"节日", none:"不记得" };
                return (
                  <button
                    key={m}
                    onClick={() => setTimeMode(m)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                      timeMode === m
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200"
                    }`}
                  >
                    {labels[m]}
                  </button>
                );
              })}
            </div>
            {timeMode === "date" && (
              <input type="date" value={exactDate} onChange={(e) => setExactDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            )}
            {timeMode === "yearMonth" && (
              <input type="month" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            )}
            {timeMode === "monthOnly" && (
              <div className="grid grid-cols-6 gap-1.5">
                {[...Array(12)].map((_, i) => (
                  <button key={i} onClick={() => setMonthOnly(String(i+1))}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      monthOnly === String(i+1)
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200"
                    }`}>
                    {i+1}月
                  </button>
                ))}
              </div>
            )}
            {timeMode === "holiday" && (
              <>
                <div className="flex gap-2 items-center mb-2">
                  <span className="text-xs text-gray-500">年份</span>
                  <select value={holidayYear} onChange={(e) => setHolidayYear(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    {[new Date().getFullYear(), new Date().getFullYear()-1, new Date().getFullYear()-2].map(y => (
                      <option key={y} value={y}>{y}年</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {HOLIDAYS.map((h) => (
                    <button key={h} onClick={() => setHoliday(h)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                        holiday === h
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200"
                      }`}>
                      {h}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 照片 */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">现场照片(可选)</label>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            {photoUrl ? (
              <div className="relative inline-block">
                <img src={photoUrl} alt="" className="w-24 h-24 object-cover rounded-lg" />
                <button onClick={() => { setPhotoUrl(null); if (photoInputRef.current) photoInputRef.current.value = ""; }}
                  className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => photoInputRef.current?.click()}
                className="flex flex-col items-center gap-1 px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer"
              >
                {uploadingPhoto ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />上传中...</>
                ) : (
                  <><Camera className="w-5 h-5" />拖拽照片到此处,或点击选择</>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 底部 */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-5 py-3 flex gap-3">
          <button onClick={handleSaveDraft} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1">
            <Save className="w-3.5 h-3.5" />存草稿
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
            取消
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
