"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon } from "lucide-react";
import type { UploadStatus, Work } from "@/types";

interface UploadZoneProps {
  onUploadStart: (count: number) => void;
  onUploadComplete: (work: Work) => void;
  onUploadError: (error: string) => void;
  status: UploadStatus;
}

export default function UploadZone({ onUploadStart, onUploadComplete, onUploadError, status }: UploadZoneProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  const uploadFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setPreviews((prev) => [...prev, e.target?.result as string]);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/classify", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上传失败");
      onUploadComplete(data.work);
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
