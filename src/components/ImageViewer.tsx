"use client";

import { useState } from "react";
import { X, CloudSun, Loader2, BookOpen } from "lucide-react";
import type { Work } from "@/types";

interface ImageViewerProps {
  work: Work;
  onClose: () => void;
}

export default function ImageViewer({ work, onClose }: ImageViewerProps) {
  const [weather, setWeather] = useState<{ temperature: number; weather: string; windSpeed: number } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const displayLabel =
    work.final_attraction || work.final_city || work.final_region || work.final_country || "未知地点";

  const locationPath = [
    work.final_country || work.ai_country,
    work.final_region || work.ai_region,
    work.final_city || work.ai_city,
    work.final_attraction || work.ai_attraction,
  ].filter(Boolean).join(" · ");

  const showWeatherBtn = work.lat != null && work.lng != null;

  const fetchWeather = async () => {
    if (!showWeatherBtn || weatherLoading) return;
    setWeatherLoading(true);
    try {
      const res = await fetch(`/api/weather?lat=${work.lat}&lng=${work.lng}`);
      if (!res.ok) throw new Error("天气获取失败");
      const data = await res.json();
      setWeather(data);
    } catch {
      // ignore
    } finally {
      setWeatherLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[1100] flex flex-col md:flex-row items-center justify-center md:gap-6 p-3 md:p-6">
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 md:top-4 md:right-4 p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* 图片 */}
      <div className="max-w-4xl max-h-[55vh] md:max-h-[85vh] flex-shrink-0">
        {work.image_url ? (
          <img
            src={work.image_url}
            alt={displayLabel}
            className="max-w-full max-h-[55vh] md:max-h-[85vh] object-contain rounded-lg"
          />
        ) : (
          <div className="w-64 h-64 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
            无图片
          </div>
        )}
      </div>

      {/* 信息列 */}
      <div className="mt-3 md:mt-0 md:max-w-sm md:overflow-y-auto md:max-h-[85vh] md:pr-2">
        {/* 标题 + 地点 */}
        <div className="text-center md:text-left">
          <p className="text-white font-medium text-lg">{displayLabel}</p>
          <p className="text-white/60 text-xs mt-1">{locationPath}</p>
        </div>

        {/* 天气 */}
        {showWeatherBtn && (
          <div className="mt-3 text-center md:text-left">
            {weather ? (
              <div className="text-white/70 text-xs">
                🌡 {weather.temperature}°C · {weather.weather} · 🌬 {weather.windSpeed} km/h
              </div>
            ) : (
              <button
                onClick={fetchWeather}
                disabled={weatherLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/70 hover:bg-white/20 text-xs transition-colors"
              >
                {weatherLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CloudSun className="w-3.5 h-3.5" />
                )}
                {weatherLoading ? "查询中..." : "查看天气"}
              </button>
            )}
          </div>
        )}

        {/* 出行参考 */}
        {work.opening_note && (
          <div className="mt-4 bg-white/8 backdrop-blur rounded-xl p-4 border border-white/10 text-left">
            <div className="flex items-center gap-1.5 mb-2 text-amber-300">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-sm font-semibold tracking-wide">出行参考</span>
            </div>
            <div className="text-white/85 text-sm leading-relaxed whitespace-pre-line">
              {work.opening_note}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
