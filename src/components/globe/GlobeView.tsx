"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useState, useMemo, useEffect, useCallback, use } from "react";
import StarrySky, { AtmosphereDust } from "./StarrySky";
import type { Work, Route } from "@/types";
import type { TimeMode } from "./TimeController";

type GlobeViewProps = {
  works: Work[];
  routes: Route[];
  onSelectWork?: (work: Work) => void;
  timeMode?: TimeMode;
};

// ─── 时间阶段定义（参考图风格） ───
interface TimePhase {
  name: string;
  lightPos: [number, number, number];
  lightIntensity: number;
  lightColor: string;
  ambientIntensity: number;
  ambientColor: string;
  atmoColor: string;
  atmoIntensity: number;
  nightLightOpacity: number;
}

const TIME_PHASES: Record<string, TimePhase> = {
  dawn: {
    name: "晨光",
    lightPos: [2.5, -0.5, -0.8],
    lightIntensity: 1.3,
    lightColor: "#ffb877",
    ambientIntensity: 0.12,
    ambientColor: "#334466",
    atmoColor: "#ff8844",
    atmoIntensity: 0.8,
    nightLightOpacity: 0.6,
  },
  day: {
    name: "日间",
    lightPos: [2.5, 1.2, 1.2],
    lightIntensity: 1.6,
    lightColor: "#fff8ee",
    ambientIntensity: 0.25,
    ambientColor: "#8899bb",
    atmoColor: "#55aaff",
    atmoIntensity: 1.0,
    nightLightOpacity: 0,
  },
  dusk: {
    name: "黄昏",
    lightPos: [-2.5, -0.3, 1.5],
    lightIntensity: 1.1,
    lightColor: "#ffaa55",
    ambientIntensity: 0.1,
    ambientColor: "#443355",
    atmoColor: "#ff6633",
    atmoIntensity: 0.9,
    nightLightOpacity: 0.4,
  },
  night: {
    name: "星辰",
    lightPos: [-2.5, -0.8, -1.5],
    lightIntensity: 0.2,
    lightColor: "#8899cc",
    ambientIntensity: 0.04,
    ambientColor: "#223355",
    atmoColor: "#3366cc",
    atmoIntensity: 0.5,
    nightLightOpacity: 1.0,
  },
};

function getCurrentPhase(): keyof typeof TIME_PHASES {
  const hour = new Date().getHours() + new Date().getMinutes() / 60;
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

// ─── 加载真实贴图 ───
function useEarthTextures() {
  const [textures, setTextures] = useState<{
    day: THREE.Texture;
    normal: THREE.Texture;
    specular: THREE.Texture;
    lights: THREE.Texture;
  } | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    let loaded = 0;
    const result: Record<string, THREE.Texture> = {};

    function onLoad(name: string) {
      return (tex: THREE.Texture) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        result[name] = tex;
        loaded++;
        if (loaded === 4) {
          setTextures({
            day: result.day,
            normal: result.normal,
            specular: result.specular,
            lights: result.lights,
          });
        }
      };
    }

    loader.load("/textures/earth-day.jpg", onLoad("day"));
    loader.load("/textures/earth-normal.jpg", onLoad("normal"));
    loader.load("/textures/earth-specular.jpg", onLoad("specular"));
    loader.load("/textures/earth-lights.jpg", onLoad("lights"));
  }, []);

  return textures;
}

// ─── 地球组件 ───
function Earth({ timeMode, textures }: { timeMode: TimeMode; textures: ReturnType<typeof useEarthTextures> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightsRef = useRef<THREE.Mesh>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambLightRef = useRef<THREE.AmbientLight>(null);
  const { clock, gl, scene } = useThree();

  const lastInteractionRef = useRef(Date.now());
  const isAutoRotatingRef = useRef(false);

  // 自然大气 shader（单层、柔和渐变、无硬边）
  const atmoMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPos.xyz;
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uIntensity;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vec3 viewDir = normalize(vViewPosition);
            float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
            // 柔和衰减，无硬边
            float soft = fresnel * uIntensity;
            gl_FragColor = vec4(uColor, soft);
          }
        `,
        uniforms: {
          uColor: { value: new THREE.Color("#55aaff") },
          uIntensity: { value: 0.6 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  );

  // 底部暖光大气（参考图左下暖金效果）
  const warmAtmoMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPos.xyz;
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform vec3 uLightDir;
          uniform float uIntensity;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vec3 viewDir = normalize(vViewPosition);
            float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.5);
            // 只在一侧（光源方向）产生暖光
            float warmSide = max(dot(vNormal, uLightDir), 0.0);
            float warm = fresnel * warmSide * uIntensity;
            gl_FragColor = vec4(uColor, warm);
          }
        `,
        uniforms: {
          uColor: { value: new THREE.Color("#ff7733") },
          uLightDir: { value: new THREE.Vector3(2.5, -0.5, -0.8).normalize() },
          uIntensity: { value: 0.5 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  );

  useFrame(() => {
    const t = clock.getElapsedTime();

    // 12 秒无操作自转
    if (Date.now() - lastInteractionRef.current > 12000) {
      if (!isAutoRotatingRef.current) isAutoRotatingRef.current = true;
      if (meshRef.current) meshRef.current.rotation.y += 0.001;
    }

    // 时间光影
    let phase: TimePhase;
    if (timeMode === "auto") phase = TIME_PHASES[getCurrentPhase()];
    else if (timeMode === "noon") phase = TIME_PHASES.day;
    else phase = TIME_PHASES.night;

    // 更新光照
    if (dirLightRef.current) {
      dirLightRef.current.position.set(...phase.lightPos);
      dirLightRef.current.intensity = phase.lightIntensity;
      dirLightRef.current.color.set(phase.lightColor);
    }
    if (ambLightRef.current) {
      ambLightRef.current.intensity = phase.ambientIntensity;
      ambLightRef.current.color.set(phase.ambientColor);
    }

    // 更新大气
    atmoMaterial.uniforms.uColor.value.set(phase.atmoColor);
    atmoMaterial.uniforms.uIntensity.value = phase.atmoIntensity * 0.6;

    // 暖光大气（晨光/黄昏时明显，星辰微弱）
    const autoPhase = timeMode === "auto" ? getCurrentPhase() : (timeMode === "noon" ? "day" : "night");
    const warmVisible = autoPhase === "dawn" || autoPhase === "dusk";
    warmAtmoMaterial.uniforms.uIntensity.value = warmVisible ? 0.4 : (autoPhase === "night" ? 0.15 : 0.25);
    warmAtmoMaterial.uniforms.uLightDir.value.set(...phase.lightPos).normalize();
    warmAtmoMaterial.uniforms.uColor.value.set(phase.atmoColor);

    // 夜间灯光
    if (lightsRef.current) {
      const mat = lightsRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = phase.nightLightOpacity;
    }
  });

  if (!textures) return null;

  return (
    <group>
      {/* 太阳光 */}
      <directionalLight ref={dirLightRef} position={[3, 1.5, 1.5]} intensity={1.5} color="#fff8ee" />
      {/* 环境光 */}
      <ambientLight ref={ambLightRef} intensity={0.25} color="#8899bb" />
      {/* 补充冷光（从反方向） */}
      <directionalLight position={[-2, -0.5, -1]} intensity={0.15} color="#4488cc" />

      {/* 地球本体：真实贴图 + 法线 + 高光 */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 96, 96]} />
        <meshPhongMaterial
          map={textures.day}
          normalMap={textures.normal}
          normalScale={new THREE.Vector2(0.85, 0.85)}
          specularMap={textures.specular}
          specular={new THREE.Color("#333333")}
          shininess={18}
          bumpMap={textures.normal}
          bumpScale={0.05}
        />
      </mesh>

      {/* 夜间城市灯光层 */}
      <mesh ref={lightsRef}>
        <sphereGeometry args={[1.003, 96, 96]} />
        <meshStandardMaterial
          map={textures.lights}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 大气辉光（单层，柔和渐变） */}
      <mesh material={atmoMaterial} scale={1.12}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>

      {/* 暖光大气（左下暖金，参考图效果） */}
      <mesh material={warmAtmoMaterial} scale={1.22}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
    </group>
  );
}

// ─── WebGL 检测 ───
function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch {
    return false;
  }
}

// ─── 主组件 ───
export default function GlobeView({ works, routes, timeMode = "auto" }: GlobeViewProps) {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);
  const textures = useEarthTextures();

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
        camera={{ position: [0, 0, 2.6], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Earth timeMode={timeMode} textures={textures} />
        <StarrySky />
        <AtmosphereDust />
        <OrbitControls
          enablePan={false}
          minDistance={1.5}
          maxDistance={6}
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.4}
        />
      </Canvas>
    </div>
  );
}
