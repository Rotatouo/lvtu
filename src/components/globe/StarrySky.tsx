"use client";

import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";

// ─── 星空粒子层（圆形发光点 + 闪烁） ───
const STAR_COUNT = 1800;

// 模块级一次生成，避免重复计算
function generateStars() {
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  const sizes = new Float32Array(STAR_COUNT);
  const twinklePhases = new Float32Array(STAR_COUNT); // 每颗星随机相位

  for (let i = 0; i < STAR_COUNT; i++) {
    // 球面均匀分布
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 90 + Math.random() * 20; // 90~110 半径范围，增加层次

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    // 颜色分布：70% 白色 / 15% 淡蓝 / 10% 淡黄 / 5% 淡红
    const colorRoll = Math.random();
    if (colorRoll < 0.7) {
      // 白色 (略偏暖)
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.98;
      colors[i * 3 + 2] = 0.95;
    } else if (colorRoll < 0.85) {
      // 淡蓝
      colors[i * 3] = 0.75;
      colors[i * 3 + 1] = 0.88;
      colors[i * 3 + 2] = 1;
    } else if (colorRoll < 0.95) {
      // 淡黄
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.95;
      colors[i * 3 + 2] = 0.7;
    } else {
      // 淡红
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.75;
      colors[i * 3 + 2] = 0.7;
    }

    // 大小分层：远处的小，近处稍大
    sizes[i] = Math.random() * 1.8 + 0.4;

    // 闪烁相位（0 ~ 2π）
    twinklePhases[i] = Math.random() * Math.PI * 2;
  }

  return { positions, colors, sizes, twinklePhases };
}

const starData = generateStars();

export default function StarrySky() {
  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!pointsRef.current) return;

    // 极慢整体旋转
    pointsRef.current.rotation.y += 0.00008;

    // 闪烁：动态更新每个粒子的透明度
    const material = pointsRef.current.material as THREE.PointsMaterial;
    const t = state.clock.elapsedTime;

    // 用 sizeAttenuation + 动态 opacity 实现闪烁
    // 通过 color 的 alpha 通道控制（PointsMaterial 不直接支持 per-particle opacity，
    // 所以用 vertexColors + 整体 opacity 脉冲模拟群体闪烁层次）
    material.opacity = 0.85 + Math.sin(t * 0.5) * 0.08;
  });

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(starData.positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(starData.colors, 3));
    g.setAttribute("size", new THREE.BufferAttribute(starData.sizes, 1));
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

// ─── 大气尘埃粒子层（高级效果：地球周围的微尘光晕） ───
const DUST_COUNT = 300;

function generateDust() {
  const positions = new Float32Array(DUST_COUNT * 3);
  const sizes = new Float32Array(DUST_COUNT);

  for (let i = 0; i < DUST_COUNT; i++) {
    // 分布在地球外围 1.05 ~ 1.35 倍半径
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.05 + Math.random() * 0.3;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    sizes[i] = Math.random() * 0.03 + 0.008;
  }

  return { positions, sizes };
}

const dustData = generateDust();

export function AtmosphereDust() {
  const ref = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.0003;
      ref.current.rotation.x += 0.0001;
      const m = ref.current.material as THREE.PointsMaterial;
      m.opacity = 0.25 + Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(dustData.positions, 3));
    g.setAttribute("size", new THREE.BufferAttribute(dustData.sizes, 1));
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.02,
        color: new THREE.Color("#6eb8ff"),
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    []
  );

  return <points ref={ref} geometry={geometry} material={material} />;
}
