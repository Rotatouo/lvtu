"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { mockWorks, mockRoutes } from "@/lib/mock-data";

const GlobeView = dynamic(() => import("@/components/globe/GlobeView"), {
  ssr: false,
  loading: () => null,
});

interface CoverGlobeProps {
  entering: boolean;
}

const subscribeToHydration = () => () => {};

export default function CoverGlobe({ entering }: CoverGlobeProps) {
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );

  if (!mounted) return null;

  return (
    <div
      className={`transition-transform duration-700 ease-out ${
        entering ? "scale-[2.8] opacity-0" : "scale-100 opacity-100"
      }`}
      style={{
        position: "absolute",
        bottom: "5%",
        left: "50%",
        transform: `translateX(-50%) ${entering ? "scale(2.8)" : "scale(1)"}`,
        width: "55vmin",
        height: "55vmin",
        transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease-out",
        transformOrigin: "center bottom",
        opacity: entering ? 0 : 1,
      }}
    >
      <GlobeView works={mockWorks} routes={mockRoutes} timeMode="auto" />
    </div>
  );
}
