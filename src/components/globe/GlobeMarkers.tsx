"use client";

import * as THREE from "three";
import { useMemo } from "react";
import MarkerBeam from "./MarkerBeam";
import type { Work, Route } from "@/types";

// 经纬度 → 3D 坐标
export function latLngToVec3(lat: number, lng: number, radius: number = 1): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

interface GlobeMarkersProps {
  works: Work[];
  routes: Route[];
  onSelectWork?: (work: Work) => void;
}

export default function GlobeMarkers({ works, routes, onSelectWork }: GlobeMarkersProps) {
  // 找出所有在路线中的 work_id
  const routedWorkIds = useMemo(() => {
    const ids = new Set<string>();
    routes.forEach((r) => (r.items || []).forEach((i) => ids.add(i.work_id)));
    return ids;
  }, [routes]);

  // 路线内标点：按路线分组，获取颜色和序号
  const routeMarkers = useMemo(() => {
    const markers: Array<{
      position: THREE.Vector3;
      color: string;
      number: number;
      work: Work;
    }> = [];

    routes.forEach((route) => {
      const sorted = (route.items || [])
        .filter((i) => i.work?.lat != null && i.work?.lng != null)
        .sort((a, b) => a.sort_order - b.sort_order);

      sorted.forEach((item, idx) => {
        if (item.work && item.work.lat != null && item.work.lng != null) {
          markers.push({
            position: latLngToVec3(item.work.lat, item.work.lng),
            color: route.color,
            number: idx,
            work: item.work,
          });
        }
      });
    });

    return markers;
  }, [routes]);

  // 非路线标点：蓝色（想去）或绿色（去过）
  const freeMarkers = useMemo(() => {
    return works
      .filter((w) => w.lat != null && w.lng != null && !routedWorkIds.has(w.id))
      .map((w) => ({
        position: latLngToVec3(w.lat!, w.lng!),
        color: w.status === "been_there" ? "#10b981" : "#3b82f6",
        work: w,
      }));
  }, [works, routedWorkIds]);

  return (
    <group>
      {/* 路线标点：光柱 + 序号 */}
      {routeMarkers.map((m, i) => (
        <MarkerBeam
          key={`route-${m.work.id}-${i}`}
          position={m.position.toArray() as [number, number, number]}
          color={m.color}
          number={m.number}
          label={m.work.final_attraction || m.work.final_city || undefined}
        />
      ))}

      {/* 自由标点：小圆球（无路线） */}
      {freeMarkers.map((m, i) => {
        const dir = m.position.clone().normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);

        return (
          <group key={`free-${m.work.id}-${i}`} position={m.position.toArray() as [number, number, number]} quaternion={quat}>
            {/* 半透明小球 */}
            <mesh>
              <sphereGeometry args={[0.018, 16, 16]} />
              <meshBasicMaterial
                color={m.color}
                transparent
                opacity={0.7}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            {/* 底部光晕 */}
            <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.02, 16]} />
              <meshBasicMaterial
                color={m.color}
                transparent
                opacity={0.3}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
