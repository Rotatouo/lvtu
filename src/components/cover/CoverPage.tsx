"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import CoverGlobe from "./CoverGlobe";
import EnterButton from "./EnterButton";
import { mockWorks } from "@/lib/mock-data";

// 统计数据
function getStats() {
  const been = mockWorks.filter((w) => w.status === "been_there");
  const countries = new Set(been.map((w) => w.final_country).filter(Boolean));
  const cities = new Set(been.map((w) => w.final_city).filter(Boolean));
  const spots = new Set(been.map((w) => w.final_attraction).filter(Boolean));
  return {
    countries: countries.size,
    cities: cities.size,
    spots: spots.size,
  };
}

export default function CoverPage() {
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const [stats, setStats] = useState({ countries: 0, cities: 0, spots: 0 });

  useEffect(() => {
    setStats(getStats());
  }, []);

  const handleEnter = () => {
    setEntering(true);
    // 0.8 秒后跳转到主页
    setTimeout(() => {
      router.push("/globe");
    }, 800);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center">
      {/* 星空背景层（CSS 星点） */}
      <div className="absolute inset-0">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 0.5 + "px",
              height: Math.random() * 2 + 0.5 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: 0.2 + Math.random() * 0.6,
            }}
          />
        ))}
      </div>

      {/* 标题区 */}
      <motion.div
        className="relative z-10 text-center mb-8"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: entering ? 0 : 1, y: entering ? -60 : 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1
          className="text-5xl sm:text-7xl font-bold tracking-wider"
          style={{
            background: "linear-gradient(135deg, #e0f0ff 0%, #7ab8ff 50%, #4a8fdd 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 0 40px rgba(100,180,255,0.3)",
          }}
        >
          旅途
        </h1>
        <motion.p
          className="mt-4 text-sm sm:text-base text-white/40 tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: entering ? 0 : 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          一座属于你的微型世界地图
        </motion.p>
      </motion.div>

      {/* 数据统计 */}
      <motion.div
        className="relative z-10 flex gap-6 mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: entering ? 0 : 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        {[
          { label: "国家", value: stats.countries },
          { label: "城市", value: stats.cities },
          { label: "景点", value: stats.spots },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
          >
            <div className="text-2xl sm:text-3xl font-bold text-white/90">{s.value}</div>
            <div className="text-xs text-white/40 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* 进入按钮 */}
      <motion.div
        className="relative z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: entering ? 0 : 1, y: entering ? 40 : 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <EnterButton entering={entering} onEnter={handleEnter} />
      </motion.div>

      {/* 3D 地球（封面版，底部居中） */}
      <CoverGlobe entering={entering} />

      {/* 进入时的全屏遮罩（星空粒子变换效果） */}
      {entering && (
        <motion.div
          className="absolute inset-0 z-30 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        />
      )}
    </div>
  );
}
