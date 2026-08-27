"use client";

// 电影级 SVG 风景场景（无需外部图片，渐变 + 多层 SVG 模拟真实摄影氛围）

const ICELAND_STARS = Array.from({ length: 40 }, (_, index) => ({
  x: index * 47 + 30,
  y: (index * 53) % 360 + 10,
  radius: (index * 17 + 11) % 10 > 6 ? 2 : 1,
}));

const TOKYO_LIGHTS = Array.from({ length: 200 }, (_, index) => ({
  x: (index * 67) % 1920,
  y: 700 + ((index * 23) % 380),
  color: (index * 29 + 7) % 10 > 4 ? "#fcd34d" : "#fb7185",
  opacity: 0.4 + (((index * 31 + 13) % 100) / 100) * 0.5,
}));

export function IcelandScene() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 天幕分层渐变 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 60% at 35% 12%, rgba(34,211,167,0.55) 0%, rgba(34,211,167,0.25) 30%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 70% 25%, rgba(99,102,241,0.4) 0%, transparent 70%)",
          filter: "blur(35px)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 40% at 50% 95%, rgba(15,42,79,0.6) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="aurora1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3a7" stopOpacity="0" />
            <stop offset="30%" stopColor="#22d3a7" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#4ade80" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22d3a7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="aurora2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
            <stop offset="35%" stopColor="#a855f7" stopOpacity="0.5" />
            <stop offset="65%" stopColor="#22d3a7" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <filter id="blur30">
            <feGaussianBlur stdDeviation="20" />
          </filter>
        </defs>

        {/* 主极光波带（流动造型） */}
        <path
          d="M -200 350 Q 400 200 800 320 T 2000 280 L 2000 600 L -200 600 Z"
          fill="url(#aurora1)"
          opacity="0.85"
          filter="url(#blur30)"
        />
        <path
          d="M -200 200 Q 600 380 1100 240 T 2120 350 L 2120 480 L -200 480 Z"
          fill="url(#aurora2)"
          opacity="0.7"
          filter="url(#blur30)"
        />

        {/* 远景雪山（冰岛特色：冰川 + 雪山） */}
        <path
          d="M 0 700 L 100 580 L 200 660 L 320 540 L 460 620 L 580 500 L 720 600 L 880 520 L 1020 580 L 1180 480 L 1320 580 L 1480 520 L 1640 620 L 1800 540 L 1920 700 L 1920 1080 L 0 1080 Z"
          fill="rgba(70, 95, 130, 0.55)"
        />

        {/* 中景山体（更深） */}
        <path
          d="M 0 780 L 120 700 L 260 760 L 400 660 L 540 740 L 680 620 L 820 700 L 980 640 L 1140 740 L 1300 680 L 1460 780 L 1620 700 L 1780 780 L 1920 700 L 1920 1080 L 0 1080 Z"
          fill="rgba(40, 60, 90, 0.7)"
        />

        {/* 近景山 */}
        <path
          d="M 0 880 L 100 820 L 220 870 L 360 800 L 520 860 L 680 790 L 840 850 L 1020 800 L 1180 870 L 1340 820 L 1500 880 L 1680 820 L 1840 880 L 1920 830 L 1920 1080 L 0 1080 Z"
          fill="url(#mountainGrad)"
        />

        {/* 雪地/前景 */}
        <rect x="0" y="1000" width="1920" height="80" fill="rgba(20, 30, 45, 0.5)" filter="url(#blur30)" />

        {/* 稀疏星星 */}
        {ICELAND_STARS.map((star, i) => (
          <circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.radius}
            fill="rgba(255, 255, 255, 0.7)"
          />
        ))}
      </svg>
    </div>
  );
}

export function TokyoScene() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 大气层 - 深夜 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 80%, rgba(236,72,153,0.4) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 30% 70%, rgba(34,211,238,0.3) 0%, transparent 65%), radial-gradient(ellipse 100% 80% at 50% 0%, rgba(15, 12, 40, 0.6) 0%, transparent 100%)",
          filter: "blur(40px)",
        }}
      />

      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#0f0a24" />
          </linearGradient>
          <linearGradient id="buildLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(252,211,77,0)" />
            <stop offset="100%" stopColor="rgba(252,211,77,0.95)" />
          </linearGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* 远景楼群 - 较暗 */}
        <g fill="url(#buildingGrad)">
          {Array.from({ length: 25 }).map((_, i) => {
            const x = i * 80;
            const h = 200 + (i % 5) * 30 + (i % 3) * 20;
            return <rect key={i} x={x} y={1080 - h - 100} width="60" height={h + 100} />;
          })}
        </g>

        {/* 中景楼群 - 东京塔/摩天楼 */}
        <g fill="rgba(20, 17, 60, 0.95)">
          {Array.from({ length: 18 }).map((_, i) => {
            const x = i * 110 + 30;
            const h = 300 + (i % 4) * 80 + (i % 3) * 50;
            return <rect key={i} x={x} y={1080 - h - 60} width="80" height={h + 60} />;
          })}
        </g>

        {/* 东京塔剪影（中央特色地标） */}
        <g fill="#0c0a26" stroke="rgba(251, 113, 133, 0.6)" strokeWidth="1.5">
          <path d="M 920 1080 L 920 480 L 880 460 L 960 460 L 920 480 L 920 320 L 940 300 L 900 300 L 920 320 L 920 480" />
        </g>

        {/* 窗户灯光 (orange/yellow specks) */}
        {TOKYO_LIGHTS.map((light, i) => {
          return (
            <rect
              key={i}
              x={light.x}
              y={light.y}
              width="3"
              height="3"
              fill={light.color}
              opacity={light.opacity}
              filter="url(#softGlow)"
            />
          );
        })}

        {/* 前景大楼 - 黑色剪影 */}
        <g fill="#0a0818">
          <rect x="0" y="900" width="400" height="180" />
          <rect x="400" y="850" width="300" height="230" />
          <rect x="700" y="820" width="500" height="260" />
          <rect x="1200" y="850" width="400" height="230" />
          <rect x="1600" y="900" width="320" height="180" />
        </g>

        {/* 街道反光（底部光泽） */}
        <rect x="0" y="1050" width="1920" height="30" fill="url(#buildLight)" opacity="0.3" />
      </svg>
    </div>
  );
}

export function SantoriniScene() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 夕阳天空渐变 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 60%, rgba(251, 191, 36, 0.6) 0%, transparent 70%), radial-gradient(ellipse 100% 50% at 50% 0%, rgba(186, 230, 253, 0.5) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="seaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0a1c33" />
          </linearGradient>
          <linearGradient id="domeWhite" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
          </linearGradient>
        </defs>

        {/* 太阳光晕（夕阳位置） */}
        <circle cx="960" cy="650" r="220" fill="rgba(251,191,36,0.55)" filter="blur(80px)" />
        <circle cx="960" cy="650" r="120" fill="rgba(255,220,140,0.85)" filter="blur(40px)" />

        {/* 海水 */}
        <rect x="0" y="800" width="1920" height="280" fill="url(#seaGrad)" />
        {/* 海水反光（夕阳倒影） */}
        <rect x="900" y="800" width="120" height="280" fill="rgba(255,220,140,0.18)" filter="blur(20px)" />

        {/* 远处小岛 */}
        <ellipse cx="1500" cy="820" rx="200" ry="20" fill="rgba(255,255,255,0.4)" />
        <ellipse cx="1500" cy="800" rx="80" ry="15" fill="rgba(255,255,255,0.6)" />

        {/* 白色穹顶 - 散落布局 */}
        {[
          { x: 200, scale: 1 },
          { x: 400, scale: 1.3 },
          { x: 650, scale: 0.9 },
          { x: 1100, scale: 1.2 },
          { x: 1350, scale: 1 },
          { x: 1700, scale: 1.1 },
        ].map((d, i) => {
          const h = 120 * d.scale;
          return (
            <g key={i} transform={`translate(${d.x}, ${780 - h})`}>
              {/* 房子主体 */}
              <rect x="-30" y="0" width="60" height={h} fill="url(#domeWhite)" />
              {/* 圆顶 */}
              <ellipse cx="0" cy="0" rx="30" ry="22" fill="url(#domeWhite)" />
              {/* 十字架 */}
              <line x1="0" y1="-22" x2="0" y2="-35" stroke="white" strokeWidth="1.5" />
              <line x1="-4" y1="-30" x2="4" y2="-30" stroke="white" strokeWidth="1.5" />
              {/* 窗户 */}
              <rect x="-5" y={h * 0.4} width="10" height="14" fill="rgba(20,40,70,0.7)" />
            </g>
          );
        })}

        {/* 前景水面 */}
        <rect x="0" y="1020" width="1920" height="60" fill="rgba(10, 28, 51, 0.7)" />
      </svg>
    </div>
  );
}

export function AlpsScene() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 落日金橙氛围 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 70%, rgba(251,146,60,0.7) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99, 102, 241, 0.55) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="alpSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(45, 25, 99, 0.4)" />
            <stop offset="40%" stopColor="rgba(139, 56, 130, 0.4)" />
            <stop offset="70%" stopColor="rgba(220, 110, 60, 0.5)" />
            <stop offset="100%" stopColor="rgba(255, 180, 110, 0.4)" />
          </linearGradient>
          <linearGradient id="sunGlow" x1="50%" y1="50%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 220, 130, 0.9)" />
            <stop offset="100%" stopColor="rgba(255, 100, 50, 0.4)" />
          </linearGradient>
          <linearGradient id="alpsBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(60, 50, 90, 0.9)" />
            <stop offset="100%" stopColor="rgba(30, 22, 50, 1)" />
          </linearGradient>
          <linearGradient id="snowCap" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 240, 210, 0.95)" />
            <stop offset="20%" stopColor="rgba(255, 230, 190, 0.85)" />
            <stop offset="50%" stopColor="rgba(220, 180, 140, 0.6)" />
            <stop offset="100%" stopColor="rgba(50, 35, 70, 0.6)" />
          </linearGradient>
        </defs>

        {/* 天空 */}
        <rect x="0" y="0" width="1920" height="700" fill="url(#alpSky)" />

        {/* 太阳（位于山后，远处一轮金黄） */}
        <circle cx="960" cy="600" r="100" fill="url(#sunGlow)" filter="blur(20px)" />
        <circle cx="960" cy="600" r="40" fill="rgba(255,250,200,0.95)" filter="blur(8px)" />

        {/* 远山（雪顶） */}
        <polygon
          points="0,720 80,640 180,540 280,420 380,500 480,400 580,520 680,440 760,560 820,500 920,580 1000,500 1080,560 1160,480 1240,540 1320,480 1420,520 1520,440 1620,560 1720,500 1820,600 1920,540 1920,720"
          fill="url(#alpsBack)"
        />
        {/* 远山雪盖（仅最高峰） */}
        <polygon
          points="180,540 230,500 280,420 330,490 380,500 280,540"
          fill="url(#snowCap)"
          opacity="0.85"
        />
        <polygon
          points="480,400 540,360 580,520 540,400 480,400"
          fill="url(#snowCap)"
          opacity="0.85"
        />
        <polygon
          points="1080,560 1140,490 1160,480 1240,540 1200,580 1080,560"
          fill="url(#snowCap)"
          opacity="0.75"
        />

        {/* 中景山 */}
        <path
          d="M 0 850 L 120 750 L 240 800 L 380 700 L 520 780 L 660 690 L 820 770 L 960 680 L 1100 760 L 1240 700 L 1380 780 L 1520 700 L 1660 770 L 1820 720 L 1920 780 L 1920 1080 L 0 1080 Z"
          fill="rgba(70, 50, 100, 0.85)"
        />

        {/* 中景山雪 */}
        <polygon
          points="380,700 440,650 520,780 460,720 380,700"
          fill="url(#snowCap)"
          opacity="0.7"
        />
        <polygon
          points="960,680 1020,640 1080,560 1100,680 960,680"
          fill="url(#snowCap)"
          opacity="0.75"
        />
        <polygon
          points="1520,700 1580,650 1660,770 1620,710 1520,700"
          fill="url(#snowCap)"
          opacity="0.7"
        />

        {/* 近景 - 山脚阴影 */}
        <path
          d="M 0 980 L 200 920 L 400 970 L 600 900 L 800 960 L 1000 910 L 1200 970 L 1400 920 L 1600 980 L 1920 940 L 1920 1080 L 0 1080 Z"
          fill="rgba(20, 15, 35, 0.95)"
        />

        {/* 草地纹理 */}
        <rect x="0" y="1000" width="1920" height="80" fill="rgba(40, 25, 60, 0.7)" />
      </svg>
    </div>
  );
}

export function WorldMapScene() {
  // 用真实的 earth-day.jpg 作为世界地图
  return null; // handled externally via CSS background
}
