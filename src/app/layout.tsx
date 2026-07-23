import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "旅途 - 我的旅行心愿单",
  description: "上传旅行截图，AI 自动分类整理你的全球旅行心愿单",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased text-gray-800 bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
