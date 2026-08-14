import type { Metadata } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/noto-serif-sc/400.css";
import "@fontsource/noto-serif-sc/300.css";
import "@fontsource/noto-serif-sc/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "旅途｜AI 产品案例",
  description: "从旅行截图识别到人工确认的 AI 应用产品案例，包含真实体验、探索性评测与 Badcase 复盘。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
