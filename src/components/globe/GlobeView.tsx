"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import StarrySky, { AtmosphereDust } from "./StarrySky";
import type { Work, Route } from "@/types";
import type { TimeMode } from "./TimeController";

type GlobeViewProps = {
  works: Work[];
  routes: Route[];
  onSelectWork?: (work: Work) => void;
  timeMode?: TimeMode;
};

// ─── 时间阶段定义 ───
interface TimePhase {
  name: string;
  lightPos: [number, number, number]; // 太阳位置
  lightIntensity: number;
  ambientIntensity: number;
  skyColor: string; // 背景渐变色（暗）
  atmosphereColor: string; // 大气辉光色
  fogColor: string;
}

const TIME_PHASES: Record<string, TimePhase> = {
  dawn: {
    name: "晨光",
    lightPos: [3, 0.3, -1],
    lightIntensity: 1.0,
    ambientIntensity: 0.2,
    skyColor: "#1a1528",
    atmosphereColor: "#ff8844",
    fogColor: "#1a1020",
  },
  day: {
    name: "日间",
    lightPos: [3, 1.5, 1.5],
    lightIntensity: 1.4,
    ambientIntensity: 0.3,
    skyColor: "#0a1628",
    atmosphereColor: "#4488ff",
    fogColor: "#0a1420",
  },
  dusk: {
    name: "黄昏",
    lightPos: [-2, 0.5, 2],
    lightIntensity: 0.9,
    ambientIntensity: 0.15,
    skyColor: "#150a18",
    atmosphereColor: "#ff6622",
    fogColor: "#12081a",
  },
  night: {
    name: "星辰",
    lightPos: [-2, 0.3, -1.5],
    lightIntensity: 0.15,
    ambientIntensity: 0.06,
    skyColor: "#050510",
    atmosphereColor: "#2244aa",
    fogColor: "#050510",
  },
};

// 根据当前时间获取阶段
function getCurrentPhase(): keyof typeof TIME_PHASES {
  const hour = new Date().getHours() + new Date().getMinutes() / 60;
  if (hour >= 5 && hour < 8) return "dawn";   // 05:00-08:00 晨光
  if (hour >= 8 && hour < 17) return "day";     // 08:00-17:00 日间
  if (hour >= 17 && hour < 20) return "dusk";    // 17:00-20:00 黄昏
  return "night";                                 // 20:00-05:00 星辰
}

// ─── 程序化地球纹理生成器 ───
function createEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  // 深海底色（多层渐变）
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, "#0c2847");
  oceanGrad.addColorStop(0.3, "#0a3d6e");
  oceanGrad.addColorStop(0.5, "#0e4a7a");
  oceanGrad.addColorStop(0.7, "#0a3d6e");
  oceanGrad.addColorStop(1, "#072040");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 用噪声模拟大陆形状（多层级叠加）
  function noise(x: number, y: number, scale: number): number {
    return (
      Math.sin(x * scale) * Math.cos(y * scale * 0.7) +
      Math.sin(x * scale * 2.3 + 1.3) * Math.cos(y * scale * 1.9 + 0.7) * 0.5 +
      Math.sin(x * scale * 5.1) * Math.cos(y * scale * 4.3) * 0.25
    );
  }

  function fbm(x: number, y: number): number {
    let v = 0;
    let a = 1;
    let f = 1;
    for (let i = 0; i < 5; i++) {
      v += noise(x, y, f) * a;
      f *= 2.1;
      a *= 0.48;
    }
    return v;
  }

  // 绘制大陆
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let py = 0; py < canvas.height; py++) {
    for (let px = 0; px < canvas.width; px++) {
      // 经纬度映射
      const lon = (px / canvas.width) * 360 - 180;
      const lat = 90 - (py / canvas.height) * 180;

      // 噪声值决定陆地/海洋
      const n = fbm(lon * 0.03, lat * 0.03);
      const idx = (py * canvas.width + px) * 4;

      if (n > 0.15) {
        // 陆地
        const elevation = (n - 0.15) * 1.8; // 0~1 左右的海拔感
        if (Math.abs(lat) > 65) {
          // 极地冰盖
          data[idx] = 220 + elevation * 35;     // R
          data[idx + 1] = 230 + elevation * 25;  // G
          data[idx + 2] = 240 + elevation * 15;  // B
        } else if (elevation > 0.5) {
          // 高地/山脉（偏棕）
          data[idx] = 60 + elevation * 80;
          data[idx + 1] = 90 + elevation * 60;
          data[idx + 2] = 45 + elevation * 30;
        } else if (elevation > 0.25) {
          // 平原/森林（绿色）
          data[idx] = 30 + elevation * 40;
          data[idx + 1] = 85 + elevation * 70;
          data[idx + 2] = 35 + elevation * 30;
        } else {
          // 低地/海岸（浅绿）
          data[idx] = 40 + elevation * 30;
          data[idx + 1] = 100 + elevation * 50;
          data[idx + 2] = 50 + elevation * 25;
        }
      } else {
        // 海洋（已有底色，加一点深度变化）
        const depth = Math.abs(n);
        data[idx] *= 1 - depth * 0.15;
        data[idx + 1] *= 1 - depth * 0.12;
        data[idx + 2] *= 1 - depth * 0.08;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // 云层效果（半透明白斑）
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const w = 30 + Math.random() * 150;
    const h = 10 + Math.random() * 40;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ─── 夜间城市灯光纹理 ───
function createCityLightsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 在陆地区域撒点状光点（模拟城市灯光）
  function isLand(lon: number, lat: number): boolean {
    const n =
      Math.sin(lon * 0.03) * Math.cos(lat * 0.03 * 0.7) +
      Math.sin(lon * 0.03 * 2.3 + 1.3) * Math.cos(lat * 0.03 * 1.9 + 0.7) * 0.5 +
      Math.sin(lon * 0.03 * 5.1) * Math.cos(lat * 0.03 * 4.3) * 0.25;
    return n > 0.15;
  }

  for (let i = 0; i < 800; i++) {
    const lon = Math.random() * 360 - 180;
    const lat = Math.random() * 180 - 90;
    if (!isLand(lon, lat)) continue; // 只在陆地上

    const px = ((lon + 180) / 360) * canvas.width;
    const py = ((90 - lat) / 180) * canvas.height;

    // 城市光点：暖黄色小圆
    const brightness = 0.4 + Math.random() * 0.6;
    ctx.fillStyle = `rgba(255, ${220 + Math.random() * 35}, ${120 + Math.random() * 80}, ${brightness})`;
    ctx.beginPath();
    ctx.arc(px, py, 1 + Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ─── 地球组件 ───
function Earth({ timeMode }: { timeMode: TimeMode }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightsRef = useRef<THREE.Mesh>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambLightRef = useRef<THREE.AmbientLight>(null);
  const { clock, gl } = useThree();

  // 当前相位（用于平滑插值）
  const currentPhaseRef = useRef<keyof typeof TIME_PHASES>("day");

  const earthTexture = useMemo(() => createEarthTexture(), []);
  const cityTexture = useMemo(() => createCityLightsTexture(), []);

  // 双层大气 shader
  const innerAtmoMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPos.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPos;
          }
        `,
        fragmentShader: `
          uniform vec3 uAtmoColor;
          uniform float uIntensity;
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          void main() {
            float rim = 1.0 - max(dot(vNormal, vec3(0, 0, 1)), 0.0);
            float power = pow(rim, 2.5);
            gl_FragColor = vec4(uAtmoColor, 1.0) * power * uIntensity;
          }
        `,
        uniforms: {
          uAtmoColor: { value: new THREE.Color("#4488ff") },
          uIntensity: { value: 1.0 },
        },
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  const outerAtmoMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uAtmoColor;
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
            gl_FragColor = vec4(uAtmoColor, 1.0) * intensity * 0.5;
          }
        `,
        uniforms: {
          uAtmoColor: { value: new THREE.Color("#8866ff") }, // 外层淡紫
        },
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  // 交互状态：上次操作时间
  const lastInteractionRef = useRef(Date.now());
  const isAutoRotatingRef = useRef(false);

  const handleInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
    isAutoRotatingRef.current = false;
  }, []);

  useFrame(() => {
    const t = clock.getElapsedTime();

    // ── 12 秒无操作后启动自转 ──
    if (Date.now() - lastInteractionRef.current > 12000) {
      if (!isAutoRotatingRef.current) {
        isAutoRotatingRef.current = true;
      }
      if (meshRef.current) {
        meshRef.current.rotation.y += 0.001; // 缓慢自转
      }
    }

    // ── 时间光影系统 ──
    let targetPhase: keyof typeof TIME_PHASES;

    if (timeMode === "auto") {
      targetPhase = getCurrentPhase();
    } else if (timeMode === "noon") {
      targetPhase = "day";
    } else {
      targetPhase = "night";
    }

    currentPhaseRef.current = targetPhase;
    const phase = TIME_PHASES[targetPhase];

    // 更新方向光
    if (dirLightRef.current) {
      dirLightRef.current.position.set(...phase.lightPos);
      dirLightRef.current.intensity = phase.lightIntensity;
    }

    // 更新环境光
    if (ambLightRef.current) {
      ambLightRef.current.intensity = phase.ambientIntensity;
    }

    // 更新大气颜色
    innerAtmoMaterial.uniforms.uAtmoColor.value.set(phase.atmosphereColor);
    innerAtmoMaterial.uniforms.uIntensity.value =
      targetPhase === "night" ? 0.6 : 1.0;

    // 夜间显示城市灯光
    if (lightsRef.current) {
      const showLights = targetPhase === "night" || targetPhase === "dusk";
      (lightsRef.current.material as THREE.MeshBasicMaterial).opacity = showLights
        ? targetPhase === "night"
          ? 0.9
          : 0.3
        : 0;
    }

    // 更新背景色（通过 scene.background）
    const scene = meshRef.current?.parent;
    if (scene && "background" in (scene as object)) {
      (scene as THREE.Scene).background = new THREE.Color(phase.skyColor);
    }
  });

  return (
    <group>
      {/* 方向光（太阳） */}
      <directionalLight
        ref={dirLightRef}
        position={[3, 1.5, 1.5]}
        intensity={1.4}
        color="#fffaf0"
      />
      {/* 环境光 */}
      <ambientLight ref={ambLightRef} intensity={0.3} color="#b0c4de" />

      {/* 地球本体 */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.75}
          metalness={0.05}
        />
      </mesh>

      {/* 夜间城市灯光层（略大于地球） */}
      <mesh ref={lightsRef}>
        <sphereGeometry args={[1.002, 64, 64]} />
        <meshBasicMaterial
          map={cityTexture}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 内层大气（蓝，紧贴地球） */}
      <mesh material={innerAtmoMaterial} scale={1.06}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>

      {/* 外层大气（紫，更远） */}
      <mesh material={outerAtmoMaterial} scale={1.18}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
    </group>
  );
}

// ─── WebGL 支持检测 ───
function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

// ─── 主组件 ───
export default function GlobeView({ works, routes, timeMode = "auto" }: GlobeViewProps) {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglOk(isWebGLAvailable());
  }, []);

  if (webglOk === false) {
    return (
      <div className="flex h-full w-full items-center justify-center text-white/60">
        <div className="text-center">
          <p className="text-lg">当前环境不支持 WebGL</p>
          <p className="mt-2 text-sm text-white/40">请在现代浏览器中打开查看 3D 地球</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#0a1628" }}
      >
        <color attach="background" args={["#0a1628"]} />
        <Earth timeMode={timeMode} />
        <StarrySky />
        <AtmosphereDust />
        <OrbitControls
          enablePan={false}
          minDistance={1.5}
          maxDistance={5}
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
