"use client";

import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";

// ─── 星空粒子（参考图风格：小而微妙的暗点） ───
const STAR_COUNT = 2000;

function generateStars() {
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  const sizes = new Float32Array(STAR_COUNT);

  for (let i = 0; i < STAR_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 80 + Math.random() * 30; // 更远，80~110

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    // 参考图：大部分白色小点，少数淡蓝
    const isBlue = Math.random() < 0.15;
    const brightness = 0.5 + Math.random() * 0.5; // 亮度随机，大部分偏暗
    colors[i * 3] = brightness * (isBlue ? 0.8 : 1);
    colors[i * 3 + 1] = brightness * (isBlue ? 0.9 : 1);
    colors[i * 3 + 2] = brightness * 1;

    // 大部分很小，极少数稍大（参考图风格）
    sizes[i] = Math.random() < 0.95 ? Math.random() * 0.8 + 0.2 : Math.random() * 1.5 + 0.8;
  }

  return { positions, colors, sizes };
}

const starData = generateStars();

export default function StarrySky() {
  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += 0.00005;
    const m = pointsRef.current.material as THREE.PointsMaterial;
    m.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
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
        size: 0.8, // 比参考图稍大一点但保持微妙
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

// ─── 大气微尘（环绕地球的微光粒子） ───
const DUST_COUNT = 200;

function generateDust() {
  const positions = new Float32Array(DUST_COUNT * 3);
  const sizes = new Float32Array(DUST_COUNT);

  for (let i = 0; i < DUST_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.08 + Math.random() * 0.25;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    sizes[i] = Math.random() * 0.015 + 0.005;
  }

  return { positions, sizes };
}

const dustData = generateDust();

export function AtmosphereDust() {
  const ref = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.0002;
      const m = ref.current.material as THREE.PointsMaterial;
      m.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 0.25) * 0.08;
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
        size: 0.012,
        color: new THREE.Color("#5aaaff"),
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    []
  );

  return <points ref={ref} geometry={geometry} material={material} />;
}
