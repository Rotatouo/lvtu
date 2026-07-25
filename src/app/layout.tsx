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
  title: "旅途 - Journey",
  description: "一座属于你的微型世界地图 - A world of your own",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body
        className="antialiased"
        style={{
          background: "#06080d",
          color: "#fff",
          fontFamily:
            '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
