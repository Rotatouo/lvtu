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

/** 把图片压到最长边 maxEdge 以内并转 JPEG，任何一步失败都退回原文件 */
async function compressImage(file: File, maxEdge = 1600, quality = 0.85): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) return file;
  if (file.type === "image/gif") return file; // 不动动图

  try {
    const bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
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

    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1024 * 1024) return file; // 本来就够小

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file; // 压完反而更大就用原图

    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
    });
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

    // 上传前压缩：手机截图常 3~8MB，base64 后再大 33%，是 504 超时的最大元凶。
    // 缩到最长边 1600px + JPEG 0.85，通常能压到 300KB 以内。
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
