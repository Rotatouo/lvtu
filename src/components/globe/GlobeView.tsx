"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useState, useMemo, useEffect } from "react";
import StarrySky from "./StarrySky";
import type { Work, Route } from "@/types";
import type { TimeMode } from "./TimeController";

type GlobeViewProps = {
  works: Work[];
  routes: Route[];
  onSelectWork?: (work: Work) => void;
  timeMode?: TimeMode;
};

// 用 Canvas 生成简化地球纹理（蓝色海洋 + 绿色大陆色块），兼容所有 WebGL 环境
function createEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // 海洋底色
  ctx.fillStyle = "#0a3d6e";
  ctx.fillRect(0, 0, 1024, 512);

  // 大陆色块（简化形状，大致对应真实位置）
  ctx.fillStyle = "#2a6b47";
  // 亚洲
  ctx.beginPath(); ctx.ellipse(750, 180, 140, 100, 0, 0, Math.PI * 2); ctx.fill();
  // 欧洲
  ctx.beginPath(); ctx.ellipse(540, 150, 70, 60, 0, 0, Math.PI * 2); ctx.fill();
  // 非洲
  ctx.beginPath(); ctx.ellipse(560, 280, 80, 110, 0, 0, Math.PI * 2); ctx.fill();
  // 北美
  ctx.beginPath(); ctx.ellipse(200, 170, 110, 90, 0, 0, Math.PI * 2); ctx.fill();
  // 南美
  ctx.beginPath(); ctx.ellipse(250, 320, 60, 90, 0, 0, Math.PI * 2); ctx.fill();
  // 澳洲
  ctx.beginPath(); ctx.ellipse(820, 350, 70, 50, 0, 0, Math.PI * 2); ctx.fill();
  // 南极
  ctx.fillStyle = "#d0e8f0";
  ctx.fillRect(0, 470, 1024, 42);

  // 加一点噪点模拟地形
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#000";
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 地球球体 + 大气辉光（兼容版：MeshStandardMaterial + 画布纹理）
function Earth({ timeMode }: { timeMode: TimeMode }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const { clock } = useThree();

  const earthTexture = useMemo(() => createEarthTexture(), []);

  // 大气 fresnel shader（简单，兼容性好）
  const atmosphereMaterial = useMemo(
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
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
            gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity * 0.8;
          }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
      }),
    []
  );

  useFrame(() => {
    // 自转
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0015;
    }
    // 时间光照
    const t = clock.getElapsedTime();
    if (lightRef.current) {
      if (timeMode === "auto") {
        const angle = t * 0.08;
        lightRef.current.position.set(
          Math.cos(angle) * 3,
          1.5,
          Math.sin(angle) * 3
        );
      } else if (timeMode === "noon") {
        lightRef.current.position.set(3, 1.5, 1.5);
      } else {
        lightRef.current.position.set(-2, 0.5, -2);
      }
    }
  });

  return (
    <group>
      {/* 太阳光 */}
      <directionalLight ref={lightRef} intensity={1.2} position={[3, 1.5, 1.5]} />
      {/* 地球 */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      {/* 大气辉光 */}
      <mesh material={atmosphereMaterial} scale={1.18}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
    </group>
  );
}

// WebGL 支持检测
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
      <Canvas camera={{ position: [0, 0, 2.2], fov: 45 }}>
        <ambientLight intensity={0.15} />
        <Earth timeMode={timeMode} />
        <StarrySky />
        <OrbitControls
          enablePan={false}
          minDistance={1.5}
          maxDistance={4}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
