"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { latLngToVec3 } from "./GlobeMarkers";
import type { Route } from "@/types";

interface RouteLinesProps {
  routes: Route[];
}

export default function RouteLines({ routes }: RouteLinesProps) {
  return (
    <group>
      {routes.map((route) => (
        <RouteLine key={route.id} route={route} />
      ))}
    </group>
  );
}

function RouteLine({ route }: { route: Route }) {
  const flowRef = useRef<THREE.Points>(null);

  // 构建贝塞尔曲线路径
  const { curve, points, flowPoints } = useMemo(() => {
    const items = (route.items || [])
      .filter((i) => i.work?.lat != null && i.work?.lng != null)
      .sort((a, b) => a.sort_order - b.sort_order);

    if (items.length < 2) return { curve: null, points: [], flowPoints: [] };

    // 获取所有坐标点
    const coords = items.map((i) => latLngToVec3(i.work!.lat!, i.work!.lng!, 1.01));

    // 构建贝塞尔曲线（相邻两点之间用三次贝塞尔）
    const path = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 0; i < coords.length - 1; i++) {
      const start = coords[i];
      const end = coords[i + 1];
      const mid = start.clone().add(end).multiplyScalar(0.5);
      // 控制点外扩（让曲线向上拱起）
      const dist = start.distanceTo(end);
      const ctrl1 = mid.clone().normalize().multiplyScalar(1 + dist * 0.3);
      const ctrl2 = mid.clone().normalize().multiplyScalar(1 + dist * 0.3);

      const curve = new THREE.CubicBezierCurve3(start, ctrl1, ctrl2, end);
      path.add(curve);
    }

    // 生成曲线上的点用于绘制
    const curvePoints = path.getPoints(100);

    // 生成流动光点（5-8个，沿曲线循环移动）
    const flowCount = Math.min(Math.max(items.length * 2, 5), 8);
    const flowPts: Array<{ t: number; speed: number }> = [];
    for (let i = 0; i < flowCount; i++) {
      flowPts.push({
        t: i / flowCount,
        speed: 0.15 + Math.random() * 0.1, // 每个光点速度略有不同
      });
    }

    return { curve: path, points: curvePoints, flowPoints: flowPts };
  }, [route]);

  // 流动光点动画
  useFrame((state) => {
    if (!flowRef.current || !curve || flowPoints.length === 0) return;

    const t = state.clock.elapsedTime;
    const positions = flowRef.current.geometry.attributes.position.array as Float32Array;

    flowPoints.forEach((fp, i) => {
      fp.t = (fp.t + fp.speed * 0.001) % 1; // 循环移动
      const pos = curve.getPoint(fp.t);
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
    });

    flowRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!curve || points.length < 2) return null;

  // 流动光点的几何体
  const flowGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(flowPoints.length * 3);
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [flowPoints.length]);

  return (
    <group>
      {/* 路线曲线 */}
      <Line
        points={points}
        color={route.color}
        lineWidth={2.5}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />

      {/* 流动光点 */}
      <points ref={flowRef} geometry={flowGeometry}>
        <pointsMaterial
          size={0.02}
          color={route.color}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation={true}
        />
      </points>
    </group>
  );
}
