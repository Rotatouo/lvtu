"use client";

import { useEffect, useRef } from "react";

// ─── 极简光标（圆环 + 减弱 bloom） ───
// 去除 v0.6.9 的水涟漪 canvas 与大面积柔光晕
// 只保留：1) 32px 主光标圆环 2) 80px 跟随柔光（减弱版）

export default function LiquidCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const bloom = bloomRef.current;
    if (!cursor || !bloom) return;

    let rafId = 0;
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    let speed = 0.3;

    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      const dt = now - lastT || 16;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      speed = Math.min(1.5, (dist / dt) * 16);

      // 平滑跟随（lerp）
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      cursor.style.opacity = "1";

      // 减弱 bloom 透明度（跟速度走，最大 0.4）
      bloom.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      bloom.style.opacity = String(Math.min(0.4, 0.18 + speed * 0.18));

      lastX = e.clientX;
      lastY = e.clientY;
      lastT = now;
    };

    const onLeave = () => {
      cursor.style.opacity = "0";
      bloom.style.opacity = "0";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* 减弱版 bloom：80px 柔光 */}
      <div
        ref={bloomRef}
        className="fixed top-0 left-0 pointer-events-none z-[54]"
        style={{
          width: 80,
          height: 80,
          marginLeft: -40,
          marginTop: -40,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(150,200,255,0.18) 0%, rgba(120,180,255,0.08) 35%, transparent 70%)",
          opacity: 0,
          transition: "opacity 0.4s ease",
          mixBlendMode: "screen",
          filter: "blur(8px)",
        }}
      />

      {/* 主光标：32px 圆环 */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[56]"
        style={{
          width: 32,
          height: 32,
          marginLeft: -16,
          marginTop: -16,
          borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,0.55)",
          boxShadow:
            "0 0 12px rgba(150,200,255,0.35), inset 0 0 6px rgba(150,200,255,0.2)",
          opacity: 0,
          transition: "opacity 0.4s ease",
          mixBlendMode: "screen",
        }}
      />
    </>
  );
}