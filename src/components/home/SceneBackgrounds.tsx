"use client";

// 5 个著名地点背景：图片优先（用户上传），优雅降级到 SVG 电影级场景
// - World Map: NASA earth-day.jpg + 经纬网格
// - Matterhorn / Trossachs / Li River / Jökulsárlón: 用户图片优先，缺失时用 SVG

const PHOTO_BG =
  "absolute inset-0 bg-cover bg-center will-change-transform";

// ──────────────────────────────────────────────────────────
// 通用：图片场景（Ken Burns + 渐变压暗 + vignette）
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
  // 使用 <img> 检测加载失败，然后切换到 fallback
  // 注意：背景图方式无法监听 onError，因此采用 <img> + 定位覆盖的方式
  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={src}
        alt=""
        loading="eager"
        decoding="async"
        className={`${PHOTO_BG} object-cover animate-[kenburns_28s_ease-in-out_infinite_alternate]`}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
          const fb = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement | null;
          if (fb) fb.style.display = "block";
        }}
      />
      {/* 兜底层（图片加载失败时显示） */}
      <div className="absolute inset-0 hidden">{fallback}</div>

      {/* 顶部压暗（左半文字区更易读） */}
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

      <style jsx>{`
        @keyframes kenburns {
          0% {
            transform: scale(1.04) translate(0, 0);
          }
          100% {
            transform: scale(1.18) translate(-2%, -1.5%);
          }
        }
      `}</style>
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
      {/* 湖面反光 */}
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
      {/* 远山喀斯特峰林 */}
      <ellipse cx="960" cy="650" rx="1000" ry="90" fill="rgba(180,150,120,0.4)" filter="url(#lrMist)" />
      {Array.from({ length: 12 }).map((_, i) => {
        const x = i * 180 + 60;
        const h = 250 + Math.random() * 200;
        return (
          <polygon
            key={i}
            points={`${x},${1080} ${x - 50},${1080 - h} ${x + 50},${1080 - h * 0.6} ${x + 100},${1080}`}
            fill="url(#lrMountain)"
            opacity={0.6 + (i % 3) * 0.1}
          />
        );
      })}
      {/* 江面 */}
      <rect y="850" width="1920" height="230" fill="rgba(120,100,70,0.35)" />
      <rect y="900" width="1920" height="180" fill="rgba(60,40,30,0.6)" />
      {/* 倒影 */}
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
      {/* 极光波动 */}
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
      {/* 远山 */}
      <polygon points="0,1080 300,650 600,1080" fill="rgba(10,30,40,0.95)" />
      <polygon points="400,1080 800,580 1100,1080" fill="rgba(5,20,30,1)" />
      <polygon points="900,1080 1300,640 1700,1080" fill="rgba(10,30,40,0.95)" />
      <polygon points="1500,1080 1800,720 1920,1080" fill="rgba(5,20,30,1)" />
      {/* 冰河湖面 */}
      <rect y="850" width="1920" height="230" fill="rgba(100,180,210,0.15)" />
      {/* 浮冰 */}
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

/** 世界地图背景（NASA 地球图 + 缓慢漂移 + 经纬网格） */
export function WorldMapScene() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, #0a1426 0%, #050810 60%, #02040a 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-90"
        style={{
          backgroundImage: "url('/textures/earth-day.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          filter: "saturate(0.85) contrast(1.05) brightness(0.95)",
          animation: "earth-drift 60s ease-in-out infinite alternate",
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full opacity-10"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {[20, 40, 60, 80].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="white" strokeWidth="0.15" />
        ))}
        {[25, 50, 75].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="100" stroke="white" strokeWidth="0.15" />
        ))}
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-transparent to-[#06080d]/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#06080d] via-[#06080d]/40 to-transparent" />
      <style jsx>{`
        @keyframes earth-drift {
          0% {
            background-position: 50% 30%;
          }
          100% {
            background-position: 55% 35%;
          }
        }
      `}</style>
    </div>
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
        className="absolute inset-0 pointer-events-none mix-blend-screen opacity-50"
        style={{
          background:
            "linear-gradient(125deg, transparent 30%, rgba(34,211,170,0.35) 45%, transparent 60%, rgba(96,165,250,0.25) 75%, transparent 100%)",
          animation: "aurora-pulse 8s ease-in-out infinite",
        }}
      />
      <style jsx>{`
        @keyframes aurora-pulse {
          0%,
          100% {
            opacity: 0.3;
            transform: translateX(0);
          }
          50% {
            opacity: 0.6;
            transform: translateX(-3%);
          }
        }
      `}</style>
    </PhotoScene>
  );
}