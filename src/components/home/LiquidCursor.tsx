"use client";

import { useEffect, useRef, useState } from "react";

// ─── 液态鼠标交互动效 ───
// 鼠标划过的地方泛起水纹涟漪 + 拖尾 + 鼠标停下后逐渐消散
// 用 canvas + requestAnimationFrame + 物理衰减模拟
interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  life: number;
  hueH: number;
}

export default function LiquidCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const lastPosRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorGlowRef = useRef<HTMLDivElement>(null);
  const [trail, setTrail] = useState<{ x: number; y: number; t: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const TRAIL_LEN = 12;
    let rafId = 0;

    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      const last = lastPosRef.current;

      // 速度
      let speed = 0.3;
      if (last) {
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dt = now - last.t;
        if (dt > 0) speed = Math.min(1.5, (dist / dt) * 16);
      }

      // 节流（快速移动时少生涟漪）
      if (Math.random() < 0.6 + speed * 0.4) {
        if (ripplesRef.current.length > 40) ripplesRef.current.shift();
        // 涟漪 hue 随机（淡蓝白），产生微妙变化
        const hue = 200 + Math.random() * 30;
        ripplesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          radius: 0,
          maxRadius: 50 + speed * 60,
          alpha: Math.min(0.55, 0.12 + speed * 0.42),
          life: 1,
          hueH: hue,
        });
      }

      // 拖尾记录
      setTrail((prev) => {
        const next = [...prev, { x: e.clientX, y: e.clientY, t: now }];
        if (next.length > TRAIL_LEN) next.shift();
        return next;
      });

      // 更新光标位置（通过 ref 直接改 DOM，比 state 高频更省）
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        cursorRef.current.style.opacity = "1";
      }
      if (cursorGlowRef.current) {
        cursorGlowRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        cursorGlowRef.current.style.opacity = String(Math.min(1, 0.35 + speed * 0.5));
      }

      lastPosRef.current = { x: e.clientX, y: e.clientY, t: now };
    };

    const onLeave = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = "0";
      if (cursorGlowRef.current) cursorGlowRef.current.style.opacity = "0";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseleave", onLeave);

    // 渲染循环
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 更新 + 绘制涟漪
      ripplesRef.current = ripplesRef.current.filter((rip) => {
        rip.radius += 1.8;
        rip.life *= 0.97;
        rip.alpha *= 0.985;

        if (rip.radius < rip.maxRadius && rip.life > 0.05) {
          // 多环（主环 + 衰减尾环）
          for (let i = 0; i < 3; i++) {
            const r = rip.radius - i * 7;
            if (r > 0) {
              ctx.beginPath();
              ctx.arc(rip.x, rip.y, r, 0, Math.PI * 2);
              const a = rip.alpha * Math.pow(0.7, i);
              ctx.strokeStyle = `hsla(${rip.hueH}, 85%, 75%, ${a})`;
              ctx.lineWidth = Math.max(0.8, 2.2 - i * 0.5);
              ctx.stroke();
            }
          }
          // 内层实心小点（"水滴"）
          if (rip.radius < rip.maxRadius * 0.6) {
            ctx.beginPath();
            ctx.arc(rip.x, rip.y, rip.radius * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${rip.hueH}, 95%, 92%, ${rip.alpha * 0.5})`;
            ctx.fill();
          }
          return true;
        }
        return false;
      });

      rafId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* 水纹层 */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[55]"
        style={{ mixBlendMode: "screen" }}
      />

      {/* 鼠标主光标（细圆环） */}
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
          boxShadow: "0 0 12px rgba(150,200,255,0.35), inset 0 0 6px rgba(150,200,255,0.2)",
          opacity: 0,
          transition: "opacity 0.5s ease, width 0.3s ease, height 0.3s ease",
          mixBlendMode: "screen",
        }}
      />

      {/* 鼠标柔光晕（动态透明度，跟着鼠标速度变亮） */}
      <div
        ref={cursorGlowRef}
        className="fixed top-0 left-0 pointer-events-none z-[54]"
        style={{
          width: 220,
          height: 220,
          marginLeft: -110,
          marginTop: -110,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(140,200,255,0.18) 0%, rgba(120,180,255,0.08) 30%, transparent 70%)",
          opacity: 0,
          transition: "opacity 0.6s ease",
          mixBlendMode: "screen",
          filter: "blur(20px)",
        }}
      />
    </>
  );
}
