"use client";

// 4 个著名地点的电影级背景场景（SVG + 渐变，无需外部图片）

export function MatterhornScene() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 65%, rgba(180,200,230,0.55) 0%, transparent 70%), radial-gradient(ellipse 90% 60% at 50% 30%, rgba(60,90,140,0.45) 0%, transparent 60%), radial-gradient(ellipse 100% 80% at 50% 100%, rgba(30,40,55,0.7) 0%, transparent 80%)",
          filter: "blur(8px)",
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="mhSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b4a6a" />
            <stop offset="40%" stopColor="#8da4c0" />
            <stop offset="65%" stopColor="#c5d0e0" />
            <stop offset="100%" stopColor="#e2eaf0" />
          </linearGradient>
          <linearGradient id="mhMountain" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#dde6f0" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#6b7889" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#2c3540" />
          </linearGradient>
          <filter id="mhMist">
            <feGaussianBlur stdDeviation="15" />
          </filter>
        </defs>

        {/* 天空 */}
        <rect x="0" y="0" width="1920" height="800" fill="url(#mhSky)" />

        {/* 远山云雾 */}
        <ellipse cx="960" cy="650" rx="900" ry="80" fill="rgba(200,215,235,0.4)" filter="url(#mhMist)" />

        {/* Matterhorn 主峰 */}
        <polygon
          points="960,120 880,560 880,820 1040,820 1040,560"
          fill="url(#mhMountain)"
        />
        {/* 雪冠反光 */}
        <polygon
          points="960,120 980,200 990,160 1000,240 1010,180 1020,260 1030,200 1040,560 960,560"
          fill="rgba(255,255,255,0.5)"
        />

        {/* 周围山脊 */}
        <polygon
          points="600,720 720,580 840,680 960,560 1080,680 1200,580 1320,720 1320,1080 600,1080"
          fill="rgba(60,70,85,0.85)"
        />

        {/* 前山暗影 */}
        <polygon
          points="0,860 200,780 400,840 600,800 800,860 1000,820 1200,880 1400,820 1600,860 1920,810 1920,1080 0,1080"
          fill="rgba(20,28,38,0.95)"
        />

        {/* 谷底森林剪影 */}
        <rect x="0" y="980" width="1920" height="100" fill="rgba(15,22,30,0.85)" />
      </svg>
    </div>
  );
}

export function TrossachsScene() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 60% at 50% 70%, rgba(220,80,40,0.55) 0%, transparent 65%), radial-gradient(ellipse 80% 50% at 50% 30%, rgba(120,40,80,0.5) 0%, transparent 70%), radial-gradient(ellipse 100% 80% at 50% 0%, rgba(35,20,50,0.75) 0%, transparent 70%)",
          filter: "blur(10px)",
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="trSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2a1a45" />
            <stop offset="40%" stopColor="#7a3060" />
            <stop offset="70%" stopColor="#e8633c" />
            <stop offset="100%" stopColor="#f5b06c" />
          </linearGradient>
          <linearGradient id="trHill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3a2840" />
            <stop offset="100%" stopColor="#1a1018" />
          </linearGradient>
          <radialGradient id="trSun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,180,100,0.95)" />
            <stop offset="100%" stopColor="rgba(255,180,100,0)" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="1920" height="1080" fill="url(#trSky)" />

        {/* 落日 */}
        <circle cx="960" cy="620" r="80" fill="url(#trSun)" />

        {/* 远山（紫色轮廓） */}
        <path
          d="M 0 600 Q 200 540 360 580 T 700 540 T 1080 590 T 1440 530 T 1780 570 L 1920 600 L 1920 800 L 0 800 Z"
          fill="rgba(80,40,80,0.6)"
        />

        {/* 中景山丘（橙色覆盖的希瑟） */}
        <path
          d="M 0 660 Q 100 540 250 600 Q 400 660 550 580 Q 700 500 900 600 Q 1100 700 1300 600 Q 1450 510 1600 620 Q 1750 730 1920 640 L 1920 1080 L 0 1080 Z"
          fill="rgba(140,60,40,0.55)"
        />

        {/* 前景深色山脊 */}
        <path
          d="M 0 760 Q 200 680 400 750 Q 600 820 800 730 Q 1000 650 1200 770 Q 1400 870 1600 750 Q 1750 680 1920 760 L 1920 1080 L 0 1080 Z"
          fill="url(#trHill)"
        />

        {/* 底部前景 */}
        <rect x="0" y="980" width="1920" height="100" fill="rgba(10,5,12,0.95)" />
      </svg>
    </div>
  );
}

export function LiRiverScene() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 55%, rgba(255,200,150,0.45) 0%, transparent 65%), radial-gradient(ellipse 100% 60% at 50% 30%, rgba(180,160,140,0.55) 0%, transparent 65%), radial-gradient(ellipse 90% 60% at 50% 100%, rgba(40,50,55,0.85) 0%, transparent 60%)",
          filter: "blur(8px)",
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="lrSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0b890" />
            <stop offset="35%" stopColor="#f5d8b8" />
            <stop offset="65%" stopColor="#d4a880" />
            <stop offset="100%" stopColor="#806050" />
          </linearGradient>
          <linearGradient id="lrWater" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5a4030" />
            <stop offset="100%" stopColor="#1a1208" />
          </linearGradient>
          <filter id="lrMist">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>

        {/* 黎明天空 */}
        <rect x="0" y="0" width="1920" height="700" fill="url(#lrSky)" />

        {/* 太阳（雾中） */}
        <circle cx="960" cy="380" r="60" fill="rgba(255,210,160,0.85)" filter="url(#lrMist)" />

        {/* 远山喀斯特峰丛（淡雾中） */}
        <path
          d="M 0 540 Q 80 480 180 520 Q 280 460 380 500 Q 480 450 580 500 Q 680 440 780 480 Q 880 420 980 460 Q 1080 410 1180 450 Q 1280 400 1380 440 Q 1480 390 1580 430 Q 1700 380 1820 420 L 1920 440 L 1920 700 L 0 700 Z"
          fill="rgba(60,40,30,0.55)"
          filter="url(#lrMist)"
        />
        <path
          d="M 0 600 Q 80 540 180 580 Q 280 530 380 570 Q 480 510 580 560 Q 680 510 780 540 Q 880 480 980 520 Q 1080 480 1180 510 Q 1280 470 1380 500 Q 1480 460 1580 490 Q 1700 440 1820 480 L 1920 500 L 1920 720 L 0 720 Z"
          fill="rgba(40,25,20,0.7)"
        />

        {/* 河水 */}
        <rect x="0" y="700" width="1920" height="380" fill="url(#lrWater)" />

        {/* 水中倒影（淡山影） */}
        <rect
          x="0"
          y="700"
          width="1920"
          height="120"
          fill="url(#lrSky)"
          opacity="0.15"
          style={{ transform: "scaleY(-1)", transformOrigin: "center" }}
        />

        {/* 渔夫剪影 */}
        <g transform="translate(960 820)" fill="#1a1208">
          {/* 竹筏 */}
          <ellipse cx="0" cy="0" rx="180" ry="6" />
          {/* 站立的人 */}
          <rect x="-20" y="-60" width="6" height="55" />
          <circle cx="-17" cy="-72" r="8" />
          {/* 鸬鹚（鸟） */}
          <ellipse cx="30" cy="-45" rx="14" ry="6" />
          <circle cx="44" cy="-48" r="4" />
          <rect x="44" y="-46" width="14" height="2" />
        </g>

        {/* 远处竹筏第二人 */}
        <g transform="translate(1140 880)" fill="#1a1208" opacity="0.85">
          <ellipse cx="0" cy="0" rx="60" ry="4" />
          <rect x="-5" y="-22" width="2.5" height="20" />
          <circle cx="-3" cy="-26" r="3" />
        </g>

        {/* 竹杆 */}
        <line x1="800" y1="860" x2="1120" y2="780" stroke="#1a1208" strokeWidth="2" />

        {/* 水雾 */}
        <ellipse cx="960" cy="720" rx="900" ry="40" fill="rgba(220,180,150,0.35)" filter="url(#lrMist)" />
      </svg>
    </div>
  );
}

export function IcelandAuroraScene() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(80,255,180,0.55) 0%, transparent 60%), radial-gradient(ellipse 50% 30% at 30% 25%, rgba(34,211,167,0.45) 0%, transparent 65%), radial-gradient(ellipse 100% 80% at 50% 100%, rgba(15,40,50,0.85) 0%, transparent 80%)",
          filter: "blur(8px)",
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="icSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#02110a" />
            <stop offset="40%" stopColor="#0a2a30" />
            <stop offset="100%" stopColor="#04181c" />
          </linearGradient>
          <linearGradient id="icAurora" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34,211,167,0)" />
            <stop offset="25%" stopColor="rgba(34,211,167,0.7)" />
            <stop offset="50%" stopColor="rgba(74,222,128,0.85)" />
            <stop offset="75%" stopColor="rgba(34,211,167,0.65)" />
            <stop offset="100%" stopColor="rgba(34,211,167,0)" />
          </linearGradient>
          <filter id="icGlow">
            <feGaussianBlur stdDeviation="15" />
          </filter>
        </defs>

        {/* 极夜天空 */}
        <rect x="0" y="0" width="1920" height="1080" fill="url(#icSky)" />

        {/* 极光波带 - 多层错开 */}
        <ellipse cx="500" cy="280" rx="500" ry="120" fill="url(#icAurora)" filter="url(#icGlow)" opacity="0.9" transform="rotate(-15 500 280)" />
        <ellipse cx="1100" cy="320" rx="600" ry="150" fill="url(#icAurora)" filter="url(#icGlow)" opacity="0.85" transform="rotate(8 1100 320)" />
        <ellipse cx="1500" cy="260" rx="450" ry="100" fill="url(#icAurora)" filter="url(#icGlow)" opacity="0.8" transform="rotate(-12 1500 260)" />

        {/* 星空（一些稀疏的亮点） */}
        {Array.from({ length: 50 }).map((_, i) => {
          const x = (i * 173) % 1920;
          const y = (i * 89) % 480;
          return <circle key={i} cx={x} cy={y} r={i % 7 === 0 ? "2" : "1"} fill="rgba(255,255,255,0.7)" />;
        })}

        {/* 远景雪山 */}
        <path
          d="M 0 700 L 200 580 L 380 660 L 540 540 L 720 620 L 880 530 L 1080 620 L 1280 560 L 1480 640 L 1680 580 L 1920 660 L 1920 800 L 0 800 Z"
          fill="rgba(20,35,45,0.95)"
        />
        {/* 雪盖 */}
        <path
          d="M 200 580 L 260 560 L 380 660 M 540 540 L 600 510 L 720 620 M 880 530 L 940 500 L 1080 620 M 1280 560 L 1340 530 L 1480 640 M 1680 580 L 1740 550 L 1920 660"
          stroke="rgba(180,200,210,0.6)"
          strokeWidth="3"
          fill="none"
        />

        {/* 海面（极光倒影） */}
        <rect x="0" y="800" width="1920" height="280" fill="rgba(5,25,30,0.95)" />
        {/* 海面反光 */}
        <rect x="0" y="800" width="1920" height="80" fill="rgba(34,211,167,0.08)" />

        {/* 前景冰块（白色硅块剪影） */}
        {[
          { x: 200, y: 970, w: 100 },
          { x: 500, y: 960, w: 140 },
          { x: 850, y: 980, w: 90 },
          { x: 1200, y: 970, w: 120 },
          { x: 1550, y: 980, w: 100 },
        ].map((b, i) => (
          <polygon
            key={i}
            points={`${b.x - b.w / 2},${b.y + 30} ${b.x},${b.y} ${b.x + b.w / 2},${b.y + 30}`}
            fill="rgba(180,200,215,0.65)"
          />
        ))}
      </svg>
    </div>
  );
}

export function WorldMapScene() {
  // 该走 3D 地球，CSS 图层只是兜底。这里用极简纯黑
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/textures/earth-day.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </div>
  );
}
