"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import {
  Upload,
  Image as ImageIcon,
  Check,
  AlertCircle,
  X,
  RotateCcw,
  Loader2,
  Ban,
  Sparkles,
} from "lucide-react";
import type { UploadStatus, Work } from "@/types";

/** /api/classify 的完整响应。以前只往外传 work，导致 AI 失败被伪装成"上传成功" */
export interface ClassifyResultPayload {
  work: Work;
  classification: { country?: string | null; confidence?: string } | null;
  ai_error?: string | null;
  ai_elapsed_ms?: number | null;
  warning?: string | null;
  duplicate?: boolean;
  duplicate_id?: string | null;
}

/** 一批上传结束后的汇总 */
export interface BatchSummary {
  total: number;
  /** AI 成功认出地点 */
  ok: number;
  /** 已入库但 AI 没认出来 */
  aiFailed: number;
  /** 请求失败，根本没入库 */
  uploadFailed: number;
}

interface UploadZoneProps {
  onUploadStart: (count: number) => void;
  onUploadComplete: (payload: ClassifyResultPayload) => void;
  onUploadError: (error: string) => void;
  /** 批量（>1 张）结束时回调；单张时不触发，仍走 onUploadError 老路径 */
  onBatchFinish?: (summary: BatchSummary) => void;
  status: UploadStatus;
}

/* ═══════════════════════════════════════════════════════════
   上传前压缩：分辨率 + 体积必须双降。

   2026-08-29 线上实测（Vercel 美国节点 → 阿里云 DashScope，代码层超时 45s）：
     1170×2532 / 113KB → 8.7s      1170×2532 / 169KB → 13.7s
     1170×2532 / 235KB → 27.8s     1170×2532 / 626KB → 超时被掐断
     739×1600  / 323KB → 9.7s      591×1280  /  52KB → 5.3s
   结论：全分辨率（~2500px）下字节数一上去就急剧劣化；缩到 1280px 后稳定在 5 秒级，
   且截图里的文字照样读得出来（confidence=high）。

   ⚠️ 绝不能因为"压完反而更大"就退回原图 —— 那正是 8-29 故障的根因：
   小红书截图多半已是压缩过的 JPEG/PNG，重编码常比原图还大，于是原图（3~8MB、
   全分辨率）被直传，AI 调用必然撞上 45s 超时上限。而 v0.7.4 原本没有代码层超时，
   同样的图跑 50 秒也能出结果 —— 用户记忆里的"以前能成功"就是这么来的。

   因此改成阶梯降档：逐级缩小直到压进字节预算；即使全部超预算，兜底也用
   "压过的最小那份"，只有在完全无法编码时才退回原图。
   ═══════════════════════════════════════════════════════════ */
const COMPRESS_STEPS = [
  { maxEdge: 1280, quality: 0.82 },
  { maxEdge: 1024, quality: 0.75 },
  { maxEdge: 800, quality: 0.7 },
];
const BYTE_BUDGET = 350 * 1024;

/** 单批最多多少张（再多了一次性等太久，且容易触发平台并发限制） */
const MAX_FILES = 20;
/** 并发数：3 条并行足够把 10 张的总耗时压到 1/3，又不至于把 DashScope 打爆 */
const CONCURRENCY = 3;

function loadBitmap(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };
    img.src = url;
  });
}

function encode(
  bitmap: HTMLImageElement,
  maxEdge: number,
  quality: number
): Promise<File | null> {
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, maxEdge / longest);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) =>
        resolve(
          blob ? new File([blob], `upload-${Date.now()}.jpg`, { type: "image/jpeg" }) : null
        ),
      "image/jpeg",
      quality
    );
  });
}

async function compressImage(file: File): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) return file;
  if (file.type === "image/gif") return file; // 不动动图

  try {
    const bitmap = await loadBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    // 本来就又小又短：不重编码，免得白白损失画质
    if (file.size <= 200 * 1024 && longest <= 1280) return file;

    let smallest: File | null = null;
    for (const step of COMPRESS_STEPS) {
      const out = await encode(bitmap, step.maxEdge, step.quality);
      if (!out) continue;
      if (!smallest || out.size < smallest.size) smallest = out;
      if (out.size <= BYTE_BUDGET) break; // 达标即止
    }
    return smallest ?? file; // 兜底用压过的最小那份，不用原图
  } catch {
    return file; // 压缩失败不阻塞上传
  }
}

/* ═══════════════════════════════════════════════════════════ */

type Phase = "queued" | "compressing" | "uploading" | "done" | "error";
type Outcome = "ok" | "ai" | "error" | "aborted";

interface BatchItem {
  id: string;
  file: File;
  preview: string;
  phase: Phase;
  error?: string;
  /** 入库了但 AI 那一半有遗憾，给缩略图打个小黄点 */
  aiNote?: string | null;
  duplicate?: boolean;
}

let seq = 0;
const nextId = () => `b${Date.now()}-${seq++}`;

export default function UploadZone({
  onUploadStart,
  onUploadComplete,
  onUploadError,
  onBatchFinish,
  status,
}: UploadZoneProps) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [rejected, setRejected] = useState(0);
  const [running, setRunning] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const urlsRef = useRef<string[]>([]);

  // 卸载时把所有预览 objectURL 释放掉
  useEffect(
    () => () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      urlsRef.current = [];
    },
    []
  );

  const clearAll = useCallback(() => {
    abortRef.current?.abort();
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
    setItems([]);
    setRejected(0);
  }, []);

  /** 处理单张：返回本次结果，供汇总统计 */
  const processOne = useCallback(
    async (item: BatchItem, signal: AbortSignal): Promise<{ outcome: Outcome; error?: string }> => {
      const patch = (p: Partial<BatchItem>) =>
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...p } : i)));

      try {
        patch({ phase: "compressing", error: undefined, aiNote: null });
        const file = await compressImage(item.file);
        if (signal.aborted) {
          patch({ phase: "queued" });
          return { outcome: "aborted" };
        }

        patch({ phase: "uploading" });
        const formData = new FormData();
        formData.append("file", file);
        // 压缩后文件名变成了 upload-<时间戳>.jpg，把原始文件名带上，
        // 服务端才能按文件名做重复检测（批量拖同一批截图时很关键）
        formData.append("originalName", item.file.name);

        const res = await fetch("/api/classify", {
          method: "POST",
          body: formData,
          signal,
        });

        // 平台超时会返回 HTML 错误页而非 JSON，这里先判 content-type 再解析
        const isJson = (res.headers.get("content-type") || "").includes("application/json");
        if (!isJson) {
          throw new Error(
            res.status === 504
              ? "识别超时（服务器 504），请重试或换一张小一点的图"
              : `服务器返回异常 (${res.status})，请重试`
          );
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "上传失败");

        // 传完整响应，别只传 work —— AI 那一半成没成要看 ai_error / classification
        const payload = data as ClassifyResultPayload;
        const aiNote = payload.ai_error
          ? `AI 识别失败：${payload.ai_error}`
          : !payload.classification?.country
            ? `未认出地点（置信度 ${payload.classification?.confidence ?? "unknown"}），可点开卡片手动补`
            : null;

        patch({ phase: "done", error: undefined, aiNote, duplicate: !!payload.duplicate });
        onUploadComplete(payload);

        return { outcome: aiNote ? "ai" : "ok" };
      } catch (err) {
        const name = err instanceof Error ? err.name : "";
        if (signal.aborted || name === "AbortError") {
          patch({ phase: "queued", error: undefined });
          return { outcome: "aborted" };
        }
        const msg = err instanceof Error ? err.message : "上传失败，请重试";
        console.error("[UploadZone] upload failed:", msg, err);
        patch({ phase: "error", error: msg });
        return { outcome: "error", error: msg };
      }
    },
    [onUploadComplete]
  );

  /** 跑一批：固定并发数的 worker pool */
  const runBatch = useCallback(
    async (queue: BatchItem[]) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setRunning(true);

      const outcomes: { outcome: Outcome; error?: string }[] = [];
      let cursor = 0;

      const worker = async () => {
        while (cursor < queue.length) {
          if (controller.signal.aborted) break;
          const item = queue[cursor++];
          const r = await processOne(item, controller.signal);
          outcomes.push(r);
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker())
      );

      setRunning(false);
      abortRef.current = null;

      const counted = outcomes.filter((o) => o.outcome !== "aborted");
      const summary: BatchSummary = {
        total: counted.length,
        ok: counted.filter((o) => o.outcome === "ok").length,
        aiFailed: counted.filter((o) => o.outcome === "ai").length,
        uploadFailed: counted.filter((o) => o.outcome === "error").length,
      };
      const lastError = [...outcomes].reverse().find((o) => o.error)?.error;

      // 单张沿用老的错误通道（主页会弹红色横幅）；批量交给汇总条
      if (queue.length === 1 && summary.uploadFailed === 1 && lastError) {
        onUploadError(lastError);
      }
      if (counted.length > 0) onBatchFinish?.(summary);

      return { summary, lastError };
    },
    [processOne, onUploadError, onBatchFinish]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejections: FileRejection[]) => {
      let rejectedCount = rejections.length;
      let files = acceptedFiles;
      if (files.length > MAX_FILES) {
        rejectedCount += files.length - MAX_FILES;
        files = files.slice(0, MAX_FILES);
      }
      if (rejectedCount > 0) setRejected(rejectedCount);
      if (files.length === 0) return;

      const newItems: BatchItem[] = files.map((file) => {
        const preview = URL.createObjectURL(file);
        urlsRef.current.push(preview);
        return { id: nextId(), file, preview, phase: "queued" as Phase };
      });

      setItems((prev) => [...prev, ...newItems]);
      onUploadStart(files.length);

      await runBatch(newItems);
    },
    [onUploadStart, runBatch]
  );

  const retryFailed = useCallback(async () => {
    const failed = items.filter((i) => i.phase === "error");
    if (failed.length === 0) return;
    setItems((prev) =>
      prev.map((i) => (i.phase === "error" ? { ...i, phase: "queued" as Phase, error: undefined } : i))
    );
    setRejected(0);
    await runBatch(failed);
  }, [items, runBatch]);

  const cancelBatch = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] },
    maxSize: 20 * 1024 * 1024,
    multiple: true,
    // running 必须是自己管的：外层 status 在第一张完成时就变成 "done" 了，
    // 只看 status 会让人在批次还没跑完时又能拖一批进来，两条队列打架。
    disabled: running || status === "uploading" || status === "classifying",
  });

  const total = items.length;
  const doneCount = items.filter((i) => i.phase === "done").length;
  const failCount = items.filter((i) => i.phase === "error").length;
  const aiNoteCount = items.filter((i) => i.phase === "done" && i.aiNote).length;
  const activeCount = items.filter(
    (i) => i.phase === "compressing" || i.phase === "uploading"
  ).length;
  const progress = total > 0 ? Math.round(((doneCount + failCount) / total) * 100) : 0;
  const isLoading = running || status === "uploading" || status === "classifying";

  return (
    <div className="mb-8">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-8 text-center cursor-pointer transition-all duration-300 active:scale-[0.99] touch-manipulation ${
          isDragActive
            ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white/50 dark:bg-gray-800/50"
        } ${isLoading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input {...getInputProps()} />

        {total > 0 ? (
          <div className="flex flex-wrap gap-2.5 justify-center">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="relative group"
                title={item.error || item.aiNote || `第 ${idx + 1} 张`}
              >
                <img
                  src={item.preview}
                  alt={`第 ${idx + 1} 张`}
                  className={`h-20 w-20 rounded-xl object-cover transition-all ${
                    item.phase === "error"
                      ? "ring-2 ring-red-400"
                      : item.phase === "done"
                        ? "ring-2 ring-emerald-400/70"
                        : "ring-1 ring-white/20"
                  }`}
                />

                {/* 进行中：转圈 + 阶段文字 */}
                {(item.phase === "compressing" || item.phase === "uploading") && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl bg-black/60">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span className="text-[9px] text-white/80">
                      {item.phase === "compressing" ? "压缩" : "识别"}
                    </span>
                  </div>
                )}

                {/* 已完成：对勾，AI 有遗憾则换成黄点 */}
                {item.phase === "done" && (
                  <span
                    className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full ${
                      item.aiNote ? "bg-amber-400" : "bg-emerald-500"
                    }`}
                  >
                    {item.aiNote ? (
                      <Sparkles className="h-3 w-3 text-black/80" />
                    ) : (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </span>
                )}

                {/* 失败：红叉 */}
                {item.phase === "error" && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
                    <X className="h-3 w-3 text-white" />
                  </span>
                )}

                {/* 排队中 */}
                {item.phase === "queued" && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                    <span className="text-[10px] text-white/70">排队</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              {isDragActive ? (
                <ImageIcon className="w-7 h-7 text-emerald-500" />
              ) : (
                <Upload className="w-7 h-7 text-emerald-500" />
              )}
            </div>
            {isDragActive ? (
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">松手上传截图</p>
            ) : (
              <>
                <p className="text-gray-700 dark:text-gray-200 font-medium mb-1">
                  拖拽或点击上传截图
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  支持 JPG、PNG、WebP，可一次选多张批量识别（最多 {MAX_FILES} 张，单张 ≤ 20MB）
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── 批量进度条 + 操作区 ───────────────────────── */}
      {total > 0 && (
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="shrink-0 text-[11px] tabular-nums text-gray-500 dark:text-white/50">
              {doneCount + failCount}/{total}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
            {activeCount > 0 && (
              <span className="text-gray-500 dark:text-white/50">
                正在处理 {activeCount} 张…
              </span>
            )}
            {doneCount > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400">
                完成 {doneCount} 张
              </span>
            )}
            {aiNoteCount > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                {aiNoteCount} 张未认出地点
              </span>
            )}
            {failCount > 0 && (
              <span className="text-red-600 dark:text-red-400">失败 {failCount} 张</span>
            )}
            {rejected > 0 && (
              <span className="text-gray-400 dark:text-white/40">
                {rejected} 个文件被跳过（格式不符 / 超 20MB / 超 {MAX_FILES} 张）
              </span>
            )}

            <span className="ml-auto flex items-center gap-1.5">
              {running && (
                <button
                  type="button"
                  onClick={cancelBatch}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/15 px-2 py-1 text-gray-600 dark:text-white/60 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  <Ban className="h-3 w-3" /> 停止
                </button>
              )}
              {!running && failCount > 0 && (
                <button
                  type="button"
                  onClick={retryFailed}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 dark:border-amber-500/40 px-2 py-1 text-amber-700 dark:text-amber-300 transition-colors hover:bg-amber-50 dark:hover:bg-amber-500/10"
                >
                  <RotateCcw className="h-3 w-3" /> 重试失败
                </button>
              )}
              {!running && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/15 px-2 py-1 text-gray-600 dark:text-white/60 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  <X className="h-3 w-3" /> 清空
                </button>
              )}
            </span>
          </div>

          {/* 失败明细 */}
          {failCount > 0 && (
            <ul className="space-y-1 rounded-xl border border-red-200 dark:border-red-500/25 bg-red-50 dark:bg-red-500/10 p-2.5">
              {items
                .filter((i) => i.phase === "error")
                .map((i, n) => (
                  <li
                    key={i.id}
                    className="flex items-start gap-1.5 text-[11px] text-red-700 dark:text-red-200"
                  >
                    <AlertCircle className="mt-px h-3 w-3 shrink-0" />
                    <span className="min-w-0 break-words">
                      第 {items.indexOf(i) + 1} 张：{i.error}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
