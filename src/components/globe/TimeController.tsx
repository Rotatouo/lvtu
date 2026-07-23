"use client";

import { Sun, Moon, Clock } from "lucide-react";

export type TimeMode = "auto" | "noon" | "night";

interface TimeControllerProps {
  mode: TimeMode;
  onChange: (mode: TimeMode) => void;
}

const modes: { key: TimeMode; label: string; icon: typeof Sun; color: string }[] = [
  { key: "auto", label: "自动", icon: Clock, color: "text-cyan-300" },
  { key: "noon", label: "全日白", icon: Sun, color: "text-amber-300" },
  { key: "night", label: "星辰", icon: Moon, color: "text-indigo-300" },
];

export default function TimeController({ mode, onChange }: TimeControllerProps) {
  return (
    <div className="flex gap-0.5 rounded-2xl bg-black/40 p-1 backdrop-blur-xl border border-white/15 shadow-lg shadow-black/20">
      {modes.map((m) => {
        const Icon = m.icon;
        const active = mode === m.key;
        return (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 ${
              active
                ? "bg-white/20 text-white shadow-inner"
                : "text-white/50 hover:text-white/80 hover:bg-white/10"
            }`}
          >
            <Icon size={13} className={active ? m.color : ""} />
            <span className={active ? "" : "hidden sm:inline"}>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
