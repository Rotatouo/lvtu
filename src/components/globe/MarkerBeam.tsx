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

export default function MarkerBeam({ position, color, number, height = 0.1, label }: MarkerBeamProps) {
  const beamRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (beamRef.current) {
      beamRef.current.position.y = Math.sin(state.clock.elapsedTime * 2 + number) * 0.006;
    }
  });

  const dir = new THREE.Vector3(...position).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);

  const numLabel = number < NUMS.length ? NUMS[number] : `${number + 1}`;

  return (
    <group position={position} quaternion={quaternion}>
      <group ref={beamRef}>
        {/* 光柱 */}
        <mesh position={[0, height / 2, 0]}>
          <cylinderGeometry args={[0.006, 0.006, height, 8]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* 光柱顶端发光小球 */}
        <mesh position={[0, height + 0.012, 0]}>
          <sphereGeometry args={[0.012, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* 光柱底部光晕 */}
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.02, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* 玻璃质感数字序号 */}
        <Html
          position={[0, height + 0.035, 0]}
          center
          distanceFactor={5}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: 600,
              border: `1.5px solid ${color}88`,
              boxShadow: `0 0 6px ${color}44, inset 0 0 4px rgba(255,255,255,0.05)`,
              userSelect: "none",
              letterSpacing: "0",
            }}
          >
            {numLabel}
          </div>
        </Html>
      </group>
    </group>
  );
}
