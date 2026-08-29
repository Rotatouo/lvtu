"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  /** "pill" 带文字说明；"icon" 只显示图标 */
  variant?: "icon" | "pill";
  /**
   * auto    —— 跟随当前主题（用于会变色的页面）
   * on-dark —— 固定按深色底配色（用于首屏等恒为深色的区域）
   */
  tone?: "auto" | "on-dark";
  className?: string;
}

export default function ThemeToggle({
  variant = "icon",
  tone = "auto",
  className = "",
}: ThemeToggleProps) {
  const { theme, toggle, ready } = useTheme();
  const isDark = theme === "dark";

  const label = isDark ? "切换到浅色（子页面生效）" : "切换到深色";

  const shell =
    tone === "on-dark"
      ? "border-white/12 bg-white/8 text-white/75 hover:bg-white/15 hover:text-white"
      : "border-line bg-surface text-fg-2 hover:border-line-2 hover:text-fg";

  const base =
    variant === "pill"
      ? `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium backdrop-blur-md transition-colors ${shell} ${className}`
      : `relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border backdrop-blur-md transition-colors ${shell} ${className}`;

  const showSun = ready && !isDark;

  return (
    <button type="button" onClick={toggle} title={label} aria-label={label} className={base}>
      <Sun
        className="h-[15px] w-[15px] transition-all duration-300"
        style={{
          position: "absolute",
          opacity: showSun ? 1 : 0,
          transform: showSun ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.5)",
        }}
      />
      <Moon
        className="h-[15px] w-[15px] transition-all duration-300"
        style={{
          position: "absolute",
          opacity: showSun ? 0 : 1,
          transform: showSun ? "rotate(90deg) scale(0.5)" : "rotate(0deg) scale(1)",
        }}
      />
      {variant === "pill" && <span className="ml-4">{isDark ? "深色" : "浅色"}</span>}
    </button>
  );
}
