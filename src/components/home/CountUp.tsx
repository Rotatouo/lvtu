"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const visibleRef = useRef(false);
  const endRef = useRef(end);
  const durationRef = useRef(duration);
  const valRef = useRef(val);

  // 让闭包始终读取最新值
  endRef.current = end;
  durationRef.current = duration;
  valRef.current = val;

  const startAnim = useCallback(() => {
    const from = valRef.current;
    const dur = durationRef.current;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const target = endRef.current;
      setVal(Math.round(from + (target - from) * eased));
      if (p < 1) requestAnimationFrame(tick);
      else setVal(target);
    };
    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          visibleRef.current = true;
          startAnim();
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [startAnim]);

  // end 变化且已在视口时，补一次滚动到最新值
  useEffect(() => {
    if (visibleRef.current) startAnim();
  }, [end, startAnim]);

  return (
    <span ref={elRef} className={className}>
      {val}
    </span>
  );
}