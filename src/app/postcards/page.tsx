"use client";

import { apiFetch } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import {
  Download,
  Check,
  Loader2,
  Mail,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import html2canvas from "html2canvas";
import type { Journal, Work } from "@/types";
import PageShell, { EmptyBlock, SectionTitle } from "@/components/PageShell";

interface JournalWithWork extends Journal {
  works?: Work | null;
}

type Template = "vintage" | "fresh" | "minimal" | "nocturne";

const templates: { key: Template; name: string; desc: string; swatch: string[] }[] = [
  { key: "vintage", name: "复古", desc: "米黄 衬线", swatch: ["#FFF8E7", "#B45309"] },
  { key: "fresh", name: "清新", desc: "白底 蓝调", swatch: ["#FFFFFF", "#2563EB"] },
  { key: "minimal", name: "极简", desc: "白底 黑白", swatch: ["#FFFFFF", "#111827"] },
  { key: "nocturne", name: "暗调", desc: "墨底 青光", swatch: ["#0B1118", "#22D3EE"] },
];

/* ═══════════════════════════════════════════════════════════
   明信片本体 —— 这是导出产物，配色固定不跟随主题
   ═══════════════════════════════════════════════════════════ */
function PostcardCanvas({
  journal,
  template,
  work,
}: {
  journal: JournalWithWork;
  template: Template;
  work: Work;
}) {
  const label = work?.final_attraction || work?.final_city || "未知";
  const location = [work?.final_country, work?.final_region, work?.final_city]
    .filter(Boolean)
    .join(" · ");
  const date = new Date(journal.created_at).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (template === "vintage") {
    return (
      <div
        className="flex w-[360px] border-2 border-amber-300"
        style={{ background: "#FFF8E7", fontFamily: "Georgia, serif" }}
      >
        {journal.photo_url && (
          <img src={journal.photo_url} alt="" className="h-48 w-40 object-cover" />
        )}
        <div className="flex flex-1 flex-col justify-center gap-2 p-4">
          <h3 className="text-base font-bold text-amber-900">{label}</h3>
          <p className="text-[10px] text-amber-700">{location}</p>
          {journal.quote && (
            <p className="text-xs italic text-amber-800">“{journal.quote}”</p>
          )}
          <p className="text-[11px] leading-relaxed text-amber-900">
            {journal.content}
          </p>
          <p className="mt-auto text-[10px] text-amber-600">{date}</p>
        </div>
      </div>
    );
  }

  if (template === "fresh") {
    return (
      <div className="w-[360px] overflow-hidden rounded-xl border border-blue-100 bg-white shadow-lg">
        {journal.photo_url && (
          <img src={journal.photo_url} alt="" className="h-44 w-full object-cover" />
        )}
        <div className="p-4">
          <h3 className="text-base font-bold text-blue-600">{label}</h3>
          <p className="mb-2 text-[11px] text-gray-500">{location}</p>
          {journal.quote && (
            <p className="mb-1 text-xs italic text-purple-500">“{journal.quote}”</p>
          )}
          <p className="text-sm leading-relaxed text-gray-700">{journal.content}</p>
          <p className="mt-3 text-[11px] text-gray-400">{date}</p>
        </div>
      </div>
    );
  }

  if (template === "nocturne") {
    return (
      <div className="w-[360px] overflow-hidden rounded-xl border border-[#1e2b3a] bg-[#0b1118]">
        {journal.photo_url && (
          <img src={journal.photo_url} alt="" className="h-44 w-full object-cover opacity-90" />
        )}
        <div className="p-4">
          <h3
            className="text-base font-semibold text-[#e8f4f8]"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            {label}
          </h3>
          <p className="mb-2 text-[11px] tracking-wide text-[#22d3ee]">
            {location}
          </p>
          {journal.quote && (
            <p className="mb-2 border-l-2 border-[#22d3ee] pl-2 text-xs italic text-[#7f9bb0]">
              {journal.quote}
            </p>
          )}
          <p className="text-[12.5px] leading-relaxed text-[#b9cadb]">
            {journal.content}
          </p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[#4a5f73]">
            {date}
          </p>
        </div>
      </div>
    );
  }

  // minimal
  return (
    <div className="w-[360px] overflow-hidden bg-white">
      {journal.photo_url && (
        <img src={journal.photo_url} alt="" className="h-56 w-full object-cover grayscale" />
      )}
      <div className="p-4">
        <h3 className="text-lg font-light tracking-wider text-black">{label}</h3>
        <p className="mb-3 text-[10px] text-gray-400">
          {location} · {date}
        </p>
        {journal.quote && (
          <p className="mb-1 text-xs italic text-gray-600">“{journal.quote}”</p>
        )}
        <p className="text-sm leading-relaxed text-gray-800">{journal.content}</p>
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
    apiFetch("/api/journals")
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
    <PageShell
      title="明信片"
      subtitle="把旅途日记做成一张可以带走的卡片"
      icon={<Mail className="h-[17px] w-[17px]" />}
    >
      {loading && (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-fg-3" />
        </div>
      )}

      {!loading && journals.length === 0 && (
        <EmptyBlock
          icon={<ImageIcon className="h-5 w-5" />}
          title="还没有可做明信片的日记"
          hint="需要带照片、且正文不少于 20 字的日记"
        />
      )}

      {journals.length > 0 && (
        <div className="space-y-7">
          {/* ── 选择日记 ─────────────────────────────── */}
          <section>
            <SectionTitle
              icon={<ImageIcon className="h-4 w-4" />}
              aside={
                <span className="text-[11px] text-fg-3">{selected.size}/6</span>
              }
            >
              选择日记
            </SectionTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {journals.map((j) => {
                const isSelected = selected.has(j.id);
                return (
                  <button
                    key={j.id}
                    onClick={() => toggleJournal(j.id)}
                    aria-pressed={isSelected}
                    className={`group relative overflow-hidden rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-brand ring-2 ring-brand/25"
                        : "border-line opacity-70 hover:opacity-100"
                    }`}
                  >
                    {j.photo_url && (
                      <img
                        src={j.photo_url}
                        alt=""
                        className="h-20 w-full object-cover"
                      />
                    )}
                    <div className="bg-surface p-2">
                      <p className="truncate text-[11px] font-medium text-fg">
                        {j.works && (j.works.final_attraction || j.works.final_city)}
                      </p>
                      <p className="truncate text-[10px] text-fg-3">
                        {j.content.slice(0, 30)}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-brand-contrast">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── 选模板 ───────────────────────────────── */}
          <section>
            <SectionTitle icon={<Sparkles className="h-4 w-4" />}>
              选择模板
            </SectionTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {templates.map((t) => {
                const active = template === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTemplate(t.key)}
                    aria-pressed={active}
                    className={`rounded-xl border p-2.5 text-left transition-all ${
                      active
                        ? "border-brand bg-brand-soft"
                        : "border-line bg-surface hover:border-line-2"
                    }`}
                  >
                    <span className="mb-1.5 flex gap-1">
                      {t.swatch.map((c) => (
                        <span
                          key={c}
                          className="h-3.5 w-3.5 rounded-full border border-black/10"
                          style={{ background: c }}
                        />
                      ))}
                    </span>
                    <span
                      className={`block text-[12px] font-medium ${
                        active ? "text-brand" : "text-fg"
                      }`}
                    >
                      {t.name}
                    </span>
                    <span className="block text-[10px] text-fg-3">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── 预览 ─────────────────────────────────── */}
          {selectedJournals.length > 0 && (
            <section>
              <SectionTitle
                icon={<Mail className="h-4 w-4" />}
                aside={
                  <span className="text-[11px] text-fg-3">
                    {selectedJournals.length} 张
                  </span>
                }
              >
                预览
              </SectionTitle>

              {/* 预览台：中性底 + 内阴影，保证浅色卡和暗色卡都能看清边界 */}
              <div className="overflow-x-auto rounded-2xl border border-line bg-surface-2 p-5">
                <div ref={canvasRef} className="mx-auto w-fit space-y-3">
                  {selectedJournals.map((j) => (
                    <PostcardCanvas
                      key={j.id}
                      journal={j}
                      template={template}
                      work={j.works as Work}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── 生成 ─────────────────────────────────── */}
          <button
            onClick={handleGenerate}
            disabled={selectedJournals.length === 0 || generating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-medium text-brand-contrast transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {generating ? "生成中…" : "生成明信片 (PNG)"}
          </button>
        </div>
      )}
    </PageShell>
  );
}
