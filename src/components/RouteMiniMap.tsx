"use client";

import { useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { Route } from "@/types";

const NUMS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫", "⑬", "⑭", "⑮", "⑯", "⑰", "⑱", "⑲", "⑳"];

function makeNumIcon(color: string, num: number) {
  return L.divIcon({
    className: "route-num",
    html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.45);">${NUMS[num] || num + 1}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function FitBounds({ points }: { points: Array<{ lat: number; lng: number }> }) {
  const map = useMap();
  const doneRef = useRef(false);
  if (doneRef.current || points.length === 0) return null;
  doneRef.current = true;
  if (points.length === 1) {
    map.setView([points[0].lat, points[0].lng], 10);
  } else {
    map.fitBounds(
      L.latLngBounds(points.map((p) => [p.lat, p.lng] as L.LatLngTuple)),
      { padding: [48, 48], maxZoom: 12 }
    );
  }
  return null;
}

interface RouteMiniMapProps {
  routes: Route[];
  height?: string;
}

export default function RouteMiniMap({ routes, height = "280px" }: RouteMiniMapProps) {
  const { allPoints, routeLines } = useMemo(() => {
    const lines: { route: Route; coords: L.LatLngTuple[]; items: NonNullable<Route["items"]> }[] = [];
    const points: Array<{ lat: number; lng: number }> = [];

    routes.forEach((route) => {
      const items = (route.items || [])
        .filter((i) => i.work?.lat != null && i.work?.lng != null)
        .sort((a, b) => a.sort_order - b.sort_order);
      if (items.length === 0) return;
      const coords = items.map((i) => [i.work!.lat!, i.work!.lng!] as L.LatLngTuple);
      lines.push({ route, coords, items });
      items.forEach((i) => points.push({ lat: i.work!.lat!, lng: i.work!.lng! }));
    });

    return { allPoints: points, routeLines: lines };
  }, [routes]);

  const center: L.LatLngTuple =
    allPoints.length > 0
      ? [
          allPoints.reduce((s, p) => s + p.lat, 0) / allPoints.length,
          allPoints.reduce((s, p) => s + p.lng, 0) / allPoints.length,
        ]
      : [35, 105];

  if (routeLines.length === 0) {
    return (
      <div
        className="themed-map flex items-center justify-center rounded-2xl border border-dashed border-line-2 bg-surface-2 px-6 text-center text-xs text-fg-3"
        style={{ height }}
      >
        路线中的地点暂无坐标
        <br />
        <span className="text-[10px] opacity-70">上传截图后会自动标记经纬度</span>
      </div>
    );
  }

  return (
    <div
      className="themed-map relative overflow-hidden rounded-2xl border border-line"
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={allPoints.length > 0 ? 5 : 3}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "100%", background: "var(--surface-2)" }}
        zoomControl={false}
        maxZoom={16}
        minZoom={2}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={allPoints} />

        {routeLines.map(({ route, coords, items }) => (
          <div key={route.id}>
            {coords.length > 1 && (
              <Polyline
                positions={coords}
                pathOptions={{ color: route.color, weight: 3, opacity: 0.8, dashArray: "6 4" }}
              />
            )}
            {items.map((item, idx) => (
              <Marker
                key={`${route.id}-${item.id}`}
                position={[item.work!.lat!, item.work!.lng!]}
                icon={makeNumIcon(route.color, idx)}
              >
                <Tooltip offset={[0, -12]} direction="top" opacity={1}>
                  <div className="text-[11px] font-semibold">
                    {item.work?.final_attraction || item.work?.final_city || "?"}
                  </div>
                  <div className="text-[10px] opacity-70">
                    {route.name} · 第 {idx + 1} 站
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </div>
        ))}
      </MapContainer>

      {/* 图例 */}
      {routeLines.length > 0 && (
        <div
          className="pointer-events-none absolute bottom-3 left-3 z-[1000] max-w-[170px] space-y-1 rounded-xl border border-line bg-surface/90 px-3 py-2 backdrop-blur"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          {routeLines.map(({ route }) => (
            <div key={route.id} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: route.color }}
              />
              <span className="truncate text-[10px] font-medium text-fg-2">
                {route.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
