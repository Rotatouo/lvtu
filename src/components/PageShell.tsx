"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface PageShellProps {
  title: string;
  /** 标题下方的一行灰色说明 */
  subtitle?: string;
  /** 标题左侧的图标（可选） */
  icon?: ReactNode;
  /** 头部右侧、主题开关之前的自定义操作区 */
  action?: ReactNode;
  /** 内容最大宽度，默认 max-w-3xl */
  maxWidth?: string;
  children: ReactNode;
}

export default function PageShell({
  title,
  subtitle,
  icon,
  action,
  maxWidth = "max-w-3xl",
  children,
}: PageShellProps) {
  return (
    <div className="relative min-h-screen bg-canvas text-fg">
      {/* 顶部氛围光（跟随主题） */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-72"
        style={{ background: "linear-gradient(to bottom, var(--glow), transparent)" }}
      />

      <header className="sticky top-0 z-30 border-b border-line bg-surface/75 backdrop-blur-xl">
        <div className={`${maxWidth} mx-auto flex items-center gap-3 px-4 py-2.5`}>
          <Link
            href="/"
            aria-label="返回首页"
            className="-ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>

          {icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
              {icon}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-semibold leading-tight tracking-tight text-fg">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-[11px] leading-tight text-fg-3">{subtitle}</p>
            )}
          </div>

          {action}
          <ThemeToggle />
        </div>
      </header>

      <main className={`relative z-10 ${maxWidth} mx-auto px-4 py-6`}>
        {children}
      </main>
    </div>
  );
}

/* ── 通用小组件：空状态区块（与首页 EmptyState 不同，这里是通用版） ── */

export function EmptyBlock({
  icon,
  title,
  hint,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-2 px-6 py-16 text-center">
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-fg-3">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-fg-2">{title}</p>
      {hint && <p className="mt-1 text-xs text-fg-3">{hint}</p>}
    </div>
  );
}

/* ── 通用小组件：区块标题 ─────────────────────────────── */

export function SectionTitle({
  icon,
  children,
  aside,
}: {
  icon?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {icon && <span className="text-brand">{icon}</span>}
      <h2 className="flex-1 text-[13px] font-semibold tracking-tight text-fg">
        {children}
      </h2>
      {aside}
    </div>
  );
}
