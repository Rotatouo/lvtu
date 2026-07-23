"use client";

import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

interface MarkerBeamProps {
  position: [number, number, number];
  color: string;
  number: number;
  height?: number;
  label?: string;
}

// 数字用圆圈数字
const NUMS = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮","⑯","⑰","⑱","⑲","⑳"];

export default function MarkerBeam({ position, color, number, height = 0.12, label }: MarkerBeamProps) {
  const beamRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (beamRef.current) {
      // 微微垂直浮动
      beamRef.current.position.y = Math.sin(state.clock.elapsedTime * 2 + number) * 0.008;
    }
  });

  // 计算从球心指向此点的法线方向
  const dir = new THREE.Vector3(...position).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);

  const numLabel = number < NUMS.length ? NUMS[number] : `${number + 1}`;

  return (
    <group position={position} quaternion={quaternion}>
      <group ref={beamRef}>
        {/* 光柱 */}
        <mesh position={[0, height / 2, 0]}>
          <cylinderGeometry args={[0.008, 0.008, height, 8]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* 光柱顶端发光小球 */}
        <mesh position={[0, height + 0.015, 0]}>
          <sphereGeometry args={[0.015, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* 光柱底部光晕（贴地小圆盘） */}
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.025, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* 数字序号（Html 标签） */}
        <Html
          position={[0, height + 0.04, 0]}
          center
          distanceFactor={6}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: color,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 700,
              border: "2px solid rgba(255,255,255,0.9)",
              boxShadow: `0 0 12px ${color}66`,
              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              userSelect: "none",
            }}
          >
            {numLabel}
          </div>
        </Html>
      </group>
    </group>
  );
}
