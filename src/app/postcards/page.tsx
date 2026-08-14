"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { ArrowLeft, Download, Check, Loader2, Image as ImageIcon } from "lucide-react";
import html2canvas from "html2canvas";
import type { Journal, Work } from "@/types";

interface JournalWithWork extends Journal {
  works?: Work | null;
}

type Template = "vintage" | "fresh" | "minimal";

const templates: { key: Template; name: string; desc: string }[] = [
  { key: "vintage", name: "复古", desc: "米黄底 衬线字" },
  { key: "fresh", name: "清新", desc: "白底 圆角 蓝标" },
  { key: "minimal", name: "极简", desc: "白底 纯文字" },
];

// 明信片渲染组件(截图目标)
function PostcardCanvas({ journal, template, work }: { journal: JournalWithWork; template: Template; work: Work }) {
  const label = work?.final_attraction || work?.final_city || "未知";
  const location = [work?.final_country, work?.final_region, work?.final_city].filter(Boolean).join(" · ");
  const date = new Date(journal.created_at).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });

  if (template === "vintage") {
    return (
      <div className="w-[360px] flex border-2 border-amber-300" style={{ background: "#FFF8E7", fontFamily: "Georgia, serif" }}>
        {journal.photo_url && <NextImage src={journal.photo_url} alt="" width={160} height={192} unoptimized loading="eager" className="w-40 h-48 object-cover" />}
        <div className="flex-1 p-4 flex flex-col justify-center gap-2">
          <h3 className="text-base font-bold text-amber-900">{label}</h3>
          <p className="text-[10px] text-amber-700">{location}</p>
          {journal.quote && <p className="text-xs italic text-amber-800">&quot;{journal.quote}&quot;</p>}
          <p className="text-[11px] text-amber-900 leading-relaxed">{journal.content}</p>
          <p className="text-[10px] text-amber-600 mt-auto">{date}</p>
        </div>
      </div>
    );
  }

  if (template === "fresh") {
    return (
      <div className="w-[360px] bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100">
        {journal.photo_url && <NextImage src={journal.photo_url} alt="" width={360} height={176} unoptimized loading="eager" className="w-full h-44 object-cover" />}
        <div className="p-4">
          <h3 className="text-base font-bold text-blue-600">{label}</h3>
          <p className="text-[11px] text-gray-500 mb-2">{location}</p>
          {journal.quote && <p className="text-xs italic text-purple-500 mb-1">&quot;{journal.quote}&quot;</p>}
          <p className="text-sm text-gray-700 leading-relaxed">{journal.content}</p>
          <p className="text-[11px] text-gray-400 mt-3">{date}</p>
        </div>
      </div>
    );
  }

  // minimal
  return (
    <div className="w-[360px] bg-white overflow-hidden">
      {journal.photo_url && <NextImage src={journal.photo_url} alt="" width={360} height={224} unoptimized loading="eager" className="w-full h-56 object-cover grayscale" />}
      <div className="p-4">
        <h3 className="text-lg font-light tracking-wider text-black">{label}</h3>
        <p className="text-[10px] text-gray-400 mb-3">{location} · {date}</p>
        {journal.quote && <p className="text-xs text-gray-600 italic mb-1">&quot;{journal.quote}&quot;</p>}
        <p className="text-sm text-gray-800 leading-relaxed">{journal.content}</p>
      </div>
    </div>
  );
}

export default function PostcardsPage() {
  const [journals, setJournals] = useState<JournalWithWork[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState<Template>("vintage");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/journals")
      .then((r) => r.json())
      .then((data) => {
        const list: JournalWithWork[] = (data.journals || []).filter(
          (j: JournalWithWork) => j.photo_url && j.content.length >= 20
        );
        setJournals(list);
        setSelected(new Set(list.length > 0 ? [list[0].id] : []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleJournal = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectedJournals = journals.filter((j) => selected.has(j.id)).slice(0, 6);

  const handleGenerate = async () => {
    if (!canvasRef.current || selectedJournals.length === 0) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 300));
    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `旅途明信片_${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="p-1 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">明信片生成</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {loading && (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        )}

        {!loading && journals.length === 0 && (
          <div className="text-center py-20 space-y-1">
            <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">还没有可做明信片的日记</p>
            <p className="text-gray-300 text-xs">先写几篇带照片的日记再来制作明信片吧</p>
          </div>
        )}

        {journals.length > 0 && (
          <>
            {/* 选择日记 */}
            <div>
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">选择日记({selected.size}/6)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {journals.map((j) => {
                  const isSelected = selected.has(j.id);
                  return (
                    <button
                      key={j.id}
                      onClick={() => toggleJournal(j.id)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100"
                      }`}
                    >
                      {j.photo_url && <NextImage src={j.photo_url} alt="" width={240} height={80} unoptimized loading="eager" className="w-full h-20 object-cover" />}
                      <div className="p-2 text-left">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {j.works && (j.works.final_attraction || j.works.final_city)}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">{j.content.slice(0, 30)}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 选模板 */}
            <div>
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">选择模板</h2>
              <div className="flex gap-2">
                {templates.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTemplate(t.key)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      template === t.key
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    {t.name}
                    <span className="block text-[10px] opacity-60">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 预览 */}
            {selectedJournals.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">预览</h2>
                <div className="space-y-3" ref={canvasRef}>
                  {selectedJournals.map((j) => (
                    <PostcardCanvas key={j.id} journal={j} template={template} work={j.works as Work} />
                  ))}
                </div>
              </div>
            )}

            {/* 生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={selectedJournals.length === 0 || generating}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {generating ? "生成中..." : "生成明信片 (PNG)"}
            </button>
          </>
        )}
      </main>
    </div>
  );
}
