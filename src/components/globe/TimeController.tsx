"use client";

import { Sun, Moon, Clock } from "lucide-react";

export type TimeMode = "auto" | "noon" | "night";

interface TimeControllerProps {
  mode: TimeMode;
  onChange: (mode: TimeMode) => void;
}

const modes = [
  { key: "auto" as const, label: "自动", icon: Clock },
  { key: "noon" as const, label: "全日白", icon: Sun },
  { key: "night" as const, label: "星辰", icon: Moon },
];

export default function TimeController({ mode, onChange }: TimeControllerProps) {
  return (
    <div className="flex gap-1 rounded-xl bg-black/30 p-1 backdrop-blur-md border border-white/10">
      {modes.map((m) => {
        const Icon = m.icon;
        const active = mode === m.key;
        return (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-white/20 text-white"
                : "text-white/60 hover:text-white/80 hover:bg-white/10"
            }`}
          >
            <Icon size={13} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
