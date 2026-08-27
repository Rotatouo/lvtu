"use client";

// 5 个著名地点背景：图片优先（用户上传），优雅降级到 SVG 电影级场景
// - World Map: NASA earth-day.jpg 静态（无 filter 无 animation）
// - Matterhorn / Trossachs / Li River / Jökulsárlón: 用户图片优先，缺失时用 SVG

const LI_RIVER_MOUNTAINS = Array.from({ length: 12 }, (_, index) => ({
  x: index * 180 + 60,
  height: 250 + ((index * 73 + 41) % 200),
}));

// ──────────────────────────────────────────────────────────
// 通用：图片场景（cover 不缩放，无黑边）
// ──────────────────────────────────────────────────────────

function PhotoScene({
  src,
  fallback,
  children,
}: {
  src: string;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {/* The native error event reveals the adjacent SVG fallback. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="eager"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: "center" }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
          const fb = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement | null;
          if (fb) fb.style.display = "block";
        }}
      />
      {/* 兜底层（图片加载失败时显示） */}
      <div className="absolute inset-0 hidden">{fallback}</div>

      {/* 左半压暗（让标题文字更易读） */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#06080d]/92 via-[#06080d]/55 to-[#06080d]/10" />
      {/* 底部压暗（统计行） */}
      <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-[#06080d]/85 via-[#06080d]/40 to-transparent" />
      {/* 电影级晕角 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(6,8,13,0.55) 100%)",
        }}
      />
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// SVG 兜底场景（电影级渐变 + 剪影）
// ──────────────────────────────────────────────────────────

function MatterhornFallback() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="mhSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b4a6a" />
          <stop offset="40%" stopColor="#8da4c0" />
          <stop offset="65%" stopColor="#c5d0e0" />
          <stop offset="100%" stopColor="#e2eaf0" />
        </linearGradient>
        <linearGradient id="mhPeak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.95" />
          <stop offset="30%" stopColor="#dde6f0" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#6b7889" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#2c3540" />
        </linearGradient>
        <filter id="mhMist">
          <feGaussianBlur stdDeviation="15" />
        </filter>
      </defs>
      <rect width="1920" height="800" fill="url(#mhSky)" />
      <ellipse cx="960" cy="650" rx="900" ry="80" fill="rgba(200,215,235,0.4)" filter="url(#mhMist)" />
      <polygon points="960,120 880,560 880,820 1040,820 1040,560" fill="url(#mhPeak)" />
      <polygon points="800,720 720,1080 1000,1080 920,720" fill="rgba(45,55,70,0.7)" />
      <polygon points="1120,720 1240,1080 1480,1080 1300,720" fill="rgba(35,45,60,0.85)" />
      <polygon points="200,820 100,1080 600,1080 400,820" fill="rgba(20,30,45,0.95)" />
    </svg>
  );
}

function TrossachsFallback() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="tsSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a1830" />
          <stop offset="50%" stopColor="#e8633c" />
          <stop offset="100%" stopColor="#f5b06c" />
        </linearGradient>
        <linearGradient id="tsMountain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0a14" />
          <stop offset="100%" stopColor="#5a2030" />
        </linearGradient>
        <filter id="tsMist">
          <feGaussianBlur stdDeviation="20" />
        </filter>
      </defs>
      <rect width="1920" height="1080" fill="url(#tsSky)" />
      <ellipse cx="960" cy="700" rx="1000" ry="100" fill="rgba(255,180,100,0.4)" filter="url(#tsMist)" />
      <polygon points="0,1080 400,520 800,1080" fill="url(#tsMountain)" />
      <polygon points="600,1080 1100,400 1500,1080" fill="rgba(10,5,15,0.95)" />
      <polygon points="1200,1080 1700,560 1920,1080" fill="rgba(20,8,18,0.9)" />
      <rect y="900" width="1920" height="180" fill="rgba(255,140,80,0.15)" />
    </svg>
  );
}

function LiRiverFallback() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="lrSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a4030" />
          <stop offset="50%" stopColor="#f5d8b8" />
          <stop offset="100%" stopColor="#d4a880" />
        </linearGradient>
        <linearGradient id="lrMountain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#806050" />
          <stop offset="100%" stopColor="#3a2818" />
        </linearGradient>
        <filter id="lrMist">
          <feGaussianBlur stdDeviation="20" />
        </filter>
      </defs>
      <rect width="1920" height="1080" fill="url(#lrSky)" />
      <ellipse cx="960" cy="650" rx="1000" ry="90" fill="rgba(180,150,120,0.4)" filter="url(#lrMist)" />
      {LI_RIVER_MOUNTAINS.map((mountain, i) => {
        const { x, height } = mountain;
        return (
          <polygon
            key={i}
            points={`${x},${1080} ${x - 50},${1080 - height} ${x + 50},${1080 - height * 0.6} ${x + 100},${1080}`}
            fill="url(#lrMountain)"
            opacity={0.6 + (i % 3) * 0.1}
          />
        );
      })}
      <rect y="850" width="1920" height="230" fill="rgba(120,100,70,0.35)" />
      <rect y="900" width="1920" height="180" fill="rgba(60,40,30,0.6)" />
      {Array.from({ length: 6 }).map((_, i) => (
        <line
          key={`r${i}`}
          x1="0"
          y1={900 + i * 30}
          x2="1920"
          y2={900 + i * 30}
          stroke="rgba(255,230,200,0.08)"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

function IcelandFallback() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="icSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#02110a" />
          <stop offset="40%" stopColor="#0a2a30" />
          <stop offset="80%" stopColor="#1a3a40" />
          <stop offset="100%" stopColor="#0a1a25" />
        </linearGradient>
        <linearGradient id="icAurora" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3a7" stopOpacity="0" />
          <stop offset="50%" stopColor="#22d3a7" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="icIce" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(150,200,220,0.6)" />
          <stop offset="100%" stopColor="rgba(50,80,100,0.3)" />
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#icSky)" />
      <path
        d="M 0,250 Q 480,100 960,250 T 1920,250 L 1920,500 L 0,500 Z"
        fill="url(#icAurora)"
        opacity="0.7"
      >
        <animate
          attributeName="opacity"
          values="0.5;0.9;0.5"
          dur="6s"
          repeatCount="indefinite"
        />
      </path>
      <polygon points="0,1080 300,650 600,1080" fill="rgba(10,30,40,0.95)" />
      <polygon points="400,1080 800,580 1100,1080" fill="rgba(5,20,30,1)" />
      <polygon points="900,1080 1300,640 1700,1080" fill="rgba(10,30,40,0.95)" />
      <polygon points="1500,1080 1800,720 1920,1080" fill="rgba(5,20,30,1)" />
      <rect y="850" width="1920" height="230" fill="rgba(100,180,210,0.15)" />
      {[
        { x: 200, y: 920, w: 80, h: 30 },
        { x: 450, y: 960, w: 60, h: 20 },
        { x: 800, y: 940, w: 100, h: 35 },
        { x: 1200, y: 970, w: 70, h: 25 },
        { x: 1500, y: 930, w: 90, h: 32 },
        { x: 1750, y: 960, w: 60, h: 22 },
      ].map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          fill="url(#icIce)"
          rx="3"
        />
      ))}
    </svg>
  );
}

// ──────────────────────────────────────────────────────────
// 公共导出
// ──────────────────────────────────────────────────────────

/** 世界地图背景（与 CoverPage WorldBackground 同款：仅一个 div，不加任何额外遮罩/网格） */
export function WorldMapScene() {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: "url('/textures/earth-day.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
  );
}

export function MatterhornScene() {
  return (
    <PhotoScene src="/destinations/matterhorn.jpg" fallback={<MatterhornFallback />} />
  );
}

export function TrossachsScene() {
  return (
    <PhotoScene src="/destinations/trossachs.jpg" fallback={<TrossachsFallback />} />
  );
}

export function LiRiverScene() {
  return (
    <PhotoScene src="/destinations/li-river.jpg" fallback={<LiRiverFallback />} />
  );
}

export function IcelandAuroraScene() {
  return (
    <PhotoScene src="/destinations/iceland.jpg" fallback={<IcelandFallback />}>
      <div
        className="absolute inset-0 pointer-events-none mix-blend-screen opacity-40"
        style={{
          background:
            "linear-gradient(125deg, transparent 30%, rgba(34,211,170,0.30) 45%, transparent 60%, rgba(96,165,250,0.20) 75%, transparent 100%)",
        }}
      />
    </PhotoScene>
  );
}
