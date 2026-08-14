"use client";

import { useState } from "react";
import { ImageUp } from "lucide-react";

import type { InferenceResult, ReviewableResult } from "../types";

interface LiveClassifierProps {
  onResult: (result: ReviewableResult) => void;
  onReturnToReplay: () => void;
}

export function LiveClassifier({
  onResult,
  onReturnToReplay,
}: LiveClassifierProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("请先选择一张旅行截图");
      return;
    }

    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);

    try {
      const response = await fetch("/api/classify-live", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        message?: string;
        result?: InferenceResult;
      };
      if (!response.ok || !payload.result) {
        throw new Error(payload.message ?? "实时识别暂时不可用");
      }
      onResult({
        id: `live-${Date.now()}`,
        mode: "live",
        ai: payload.result,
        verified: {
          country: payload.result.country,
          region: payload.result.region,
          city: payload.result.city,
          attraction: payload.result.attraction,
        },
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "实时识别暂时不可用",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p>实时模型调用</p>
      <form onSubmit={handleSubmit}>
        <label>
          <span>选择旅行截图</span>
          <input
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>
        <button disabled={loading} type="submit">
          <ImageUp aria-hidden="true" size={18} />
          {loading ? "正在识别" : "开始识别"}
        </button>
      </form>
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button onClick={onReturnToReplay} type="button">
            返回评测记录回放
          </button>
        </div>
      ) : null}
    </div>
  );
}
