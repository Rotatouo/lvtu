"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  Tooltip,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import type { Work, Route } from "@/types";

const NUMS = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮","⑯","⑰","⑱","⑲","⑳"];

const wantIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="width:12px;height:12px;border-radius:50%;background:#60a5fa;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const beenIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#10b981;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function makeNumIcon(color: string, num: number) {
  return L.divIcon({
    className: "route-num",
    html: `<div style="width:20px;height:20px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.5);">${NUMS[num] || (num + 1)}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function FitBounds({ works }: { works: Array<{ lat: number; lng: number }> }) {
  const map = useMap();
  const doneKey = useRef("");
  const deps = works.map((w) => `${w.lat},${w.lng}`).join("|");

  useEffect(() => {
    if (doneKey.current === deps) return;
    doneKey.current = deps;
    if (works.length === 0) return;

    if (works.length === 1) {
      map.setView([works[0].lat, works[0].lng], 10);
    } else {
      map.fitBounds(L.latLngBounds(works.map((w) => [w.lat, w.lng] as L.LatLngTuple)), { padding: [40, 40], maxZoom: 14 });
    }
  }, [deps, map, works]);

  return null;
}

type MapFilter = "all" | "markers" | "routes_all" | string; // "routes_all" | routeId

interface MapViewProps {
  works: Work[];
  routes: Route[];
  onSelectWork: (work: Work) => void;
}

export default function MapView({ works, routes, onSelectWork }: MapViewProps) {
  const [filter, setFilter] = useState<MapFilter>("all");
  const [showFilter, setShowFilter] = useState(false);

  const geoWorks = useMemo(() => works.filter((w) => w.lat != null && w.lng != null), [works]);

  // 找出所有在路线中的 work_id
  const routedWorkIds = useMemo(() => {
    const ids = new Set<string>();
    routes.forEach((r) => (r.items || []).forEach((i) => ids.add(i.work_id)));
    return ids;
  }, [routes]);

  const showMarkers = filter === "all" || filter === "markers";
  const showRoutes = filter === "all" || filter.startsWith("routes_");

  const visibleRoutes = useMemo(() => {
    if (filter === "routes_all") return routes;
    if (filter.startsWith("routes_") && filter !== "routes_all") {
      const routeId = filter.replace("routes_", "");
      return routes.filter((r) => r.id === routeId);
    }
    return showRoutes ? routes : [];
  }, [filter, routes, showRoutes]);

  const center = useMemo<L.LatLngTuple>(() => {
    if (geoWorks.length > 0) {
      const avgLat = geoWorks.reduce((s, w) => s + w.lat!, 0) / geoWorks.length;
      const avgLng = geoWorks.reduce((s, w) => s + w.lng!, 0) / geoWorks.length;
      return [avgLat, avgLng];
    }
    return [35, 105];
  }, [geoWorks]);

  const defaultZoom = geoWorks.length > 0 ? 5 : 3;

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%", background: "#e8e8e8" }}
        zoomControl={true}
        maxZoom={18}
        minZoom={2}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds works={geoWorks as Array<{ lat: number; lng: number }>} />

        {/* 标记点 */}
        {showMarkers && geoWorks.map((work) => {
          const inRoute = routedWorkIds.has(work.id);
          const isBeen = work.status === "been_there";
          const label = work.final_attraction || work.final_city || work.final_country || "未知";
          return (
            <Marker
              key={work.id}
              position={[work.lat!, work.lng!]}
              icon={inRoute ? (isBeen ? beenIcon : wantIcon) : (isBeen ? beenIcon : wantIcon)}
              eventHandlers={{ click: () => onSelectWork(work) }}
            >
              <Tooltip offset={[0, -10]} direction="top">{label}</Tooltip>
            </Marker>
          );
        })}

        {/* 路线连线 + 序号 */}
        {showRoutes && visibleRoutes.map((route) => {
          const items = (route.items || [])
            .filter((i) => i.work?.lat != null && i.work?.lng != null)
            .sort((a, b) => a.sort_order - b.sort_order);
          if (items.length < 2) return null;

          const coords = items.map((i) => [i.work!.lat!, i.work!.lng!] as L.LatLngTuple);
          return (
            <div key={route.id}>
              <Polyline positions={coords} pathOptions={{ color: route.color, weight: 3, opacity: 0.7, dashArray: "8 4" }} />
              {items.map((item, idx) => (
                <Marker
                  key={`${route.id}-${item.id}`}
                  position={[item.work!.lat!, item.work!.lng!]}
                  icon={makeNumIcon(route.color, idx)}
                >
                  <Tooltip offset={[0, -14]} direction="top">
                    {item.work?.final_attraction || item.work?.final_city || "?"}
                  </Tooltip>
                </Marker>
              ))}
            </div>
          );
        })}
      </MapContainer>

      {/* 过滤器按钮 */}
      <div className="absolute top-3 right-3 z-[1000]">
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`w-8 h-8 rounded-lg shadow flex items-center justify-center text-sm font-bold transition-colors ${
            filter !== "all" ? "bg-blue-600 text-white" : "bg-white text-gray-700"
          }`}
        >
          ☰
        </button>
        {showFilter && (
          <div className="absolute top-10 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[160px] text-xs">
            <button onClick={() => { setFilter("all"); setShowFilter(false); }}
              className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 ${filter === "all" ? "text-blue-600 font-medium" : "text-gray-600 dark:text-gray-300"}`}>
              ● 显示全部
            </button>
            <button onClick={() => { setFilter("markers"); setShowFilter(false); }}
              className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 ${filter === "markers" ? "text-blue-600 font-medium" : "text-gray-600 dark:text-gray-300"}`}>
              ○ 只显示标记点
            </button>
            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
            <button onClick={() => { setFilter("routes_all"); setShowFilter(false); }}
              className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 ${filter === "routes_all" ? "text-blue-600 font-medium" : "text-gray-600 dark:text-gray-300"}`}>
              ○ 全部路线
            </button>
            {routes.map((r) => (
              <button key={r.id} onClick={() => { setFilter(`routes_${r.id}`); setShowFilter(false); }}
                className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${filter === `routes_${r.id}` ? "text-blue-600 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                {r.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 左下角图例 */}
      {showRoutes && visibleRoutes.length > 0 && (
        <div className="absolute bottom-6 left-3 z-[1000] bg-white/90 dark:bg-gray-800/90 rounded-lg shadow px-3 py-2 text-[10px] space-y-1">
          {visibleRoutes.map((r) => (
            <div key={r.id} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
              <span className="text-gray-600 dark:text-gray-300">{r.name}</span>
            </div>
          ))}
        </div>
      )}

      {geoWorks.length === 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow text-sm text-gray-500 dark:text-gray-400 pointer-events-none">
          暂无坐标，上传后自动标记
        </div>
      )}
    </div>
  );
}
