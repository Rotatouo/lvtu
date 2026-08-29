"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon } from "lucide-react";
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

interface UploadZoneProps {
  onUploadStart: (count: number) => void;
  onUploadComplete: (payload: ClassifyResultPayload) => void;
  onUploadError: (error: string) => void;
  status: UploadStatus;
}

/**
 * 上传前压缩：分辨率 + 体积必须双降。
 *
 * 2026-08-29 线上实测（Vercel 美国节点 → 阿里云 DashScope，代码层超时 45s）：
 *   1170×2532 / 113KB → 8.7s      1170×2532 / 169KB → 13.7s
 *   1170×2532 / 235KB → 27.8s     1170×2532 / 626KB → 超时被掐断
 *   739×1600  / 323KB → 9.7s      591×1280  /  52KB → 5.3s
 * 结论：全分辨率（~2500px）下字节数一上去就急剧劣化；缩到 1280px 后稳定在 5 秒级，
 * 且截图里的文字照样读得出来（confidence=high）。
 *
 * ⚠️ 绝不能因为"压完反而更大"就退回原图 —— 那正是 8-29 故障的根因：
 * 小红书截图多半已是压缩过的 JPEG/PNG，重编码常比原图还大，于是原图（3~8MB、
 * 全分辨率）被直传，AI 调用必然撞上 45s 超时上限。而 v0.7.4 原本没有代码层超时，
 * 同样的图跑 50 秒也能出结果 —— 用户记忆里的"以前能成功"就是这么来的。
 *
 * 因此改成阶梯降档：逐级缩小直到压进字节预算；即使全部超预算，兜底也用
 * "压过的最小那份"，只有在完全无法编码时才退回原图。
 */
const COMPRESS_STEPS = [
  { maxEdge: 1280, quality: 0.82 },
  { maxEdge: 1024, quality: 0.75 },
  { maxEdge: 800, quality: 0.7 },
];
const BYTE_BUDGET = 350 * 1024;

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

export default function UploadZone({ onUploadStart, onUploadComplete, onUploadError, status }: UploadZoneProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  const uploadFile = async (original: File) => {
    // 预览用原图（本地即时显示，不等压缩）
    const reader = new FileReader();
    reader.onload = (e) => setPreviews((prev) => [...prev, e.target?.result as string]);
    reader.readAsDataURL(original);

    // 上传前压缩：手机截图常 3~8MB。不压的话 base64 后体积再涨 33%，
    // 从 Vercel（美国）打到阿里云 DashScope 会撞上 45s 超时上限（实测 626KB 必挂）。
    const file = await compressImage(original);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/classify", { method: "POST", body: formData });
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
      onUploadComplete(data as ClassifyResultPayload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "上传失败，请重试";
      console.error("[UploadZone] upload failed:", msg, err);
      onUploadError(msg);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      onUploadStart(acceptedFiles.length);
      for (const file of acceptedFiles) {
        await uploadFile(file);
      }
    },
    [onUploadStart, onUploadComplete, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] },
    maxSize: 20 * 1024 * 1024,
    multiple: true,
    disabled: status === "uploading" || status === "classifying",
  });

  const isLoading = status === "uploading" || status === "classifying";

  return (
    <div className="mb-8">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-8 text-center cursor-pointer transition-all duration-300 active:scale-[0.99] touch-manipulation ${
          isDragActive ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white/50 dark:bg-gray-800/50"
        } ${isLoading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input {...getInputProps()} />

        {previews.length > 0 ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {previews.map((p, i) => (
              <img key={i} src={p} alt={`预览 ${i + 1}`} className="max-h-32 rounded-lg" />
            ))}
            {isLoading && (
              <div className="absolute inset-0 bg-black/30 dark:bg-black/50 rounded-2xl flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2" />
                  <p className="text-sm">{status === "uploading" ? "正在上传…" : "AI 正在识别…"}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              {isDragActive ? <ImageIcon className="w-7 h-7 text-emerald-500" /> : <Upload className="w-7 h-7 text-emerald-500" />}
            </div>
            {isDragActive ? (
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">松手上传截图</p>
            ) : (
              <>
                <p className="text-gray-700 dark:text-gray-200 font-medium mb-1">拖拽或点击上传截图</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">支持 JPG、PNG、WebP，可多选，单张最大 20MB</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
