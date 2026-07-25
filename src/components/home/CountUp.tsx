"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 数字滚动到目标值的动画（支持 0 起步 + ease-out 曲线）
 * 仅渲染一次（IntersectionObserver 触发）
 */
export default function CountUp({
  end,
  duration = 1400,
  className = "",
  start = 0,
}: {
  end: number;
  duration?: number;
  className?: string;
  start?: number;
}) {
  const [val, setVal] = useState(start);
  const elRef = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    const el = elRef.current;
    if (!el) return;

    const startAnim = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(start + (end - start) * eased));
        if (p < 1) requestAnimationFrame(tick);
        else setVal(end);
      };
      requestAnimationFrame(tick);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          startAnim();
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration, start]);

  return (
    <span ref={elRef} className={className}>
      {val}
    </span>
  );
}