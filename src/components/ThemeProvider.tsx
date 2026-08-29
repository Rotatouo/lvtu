"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "light" | "dark";

interface ThemeCtxValue {
  theme: Theme;
  /** 是否已经从 localStorage 恢复过（避免首帧闪烁时读到默认值） */
  ready: boolean;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeCtx = createContext<ThemeCtxValue>({
  theme: "dark",
  ready: false,
  setTheme: () => {},
  toggle: () => {},
});

const STORAGE_KEY = "lvtu-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 默认深色，与品牌基调一致；挂载后由 localStorage 覆盖
  const [theme, setThemeState] = useState<Theme>("dark");
  const [ready, setReady] = useState(false);

  // 首次挂载：读取用户上次的选择
  useEffect(() => {
    let initial: Theme = "dark";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") initial = stored;
    } catch {
      // localStorage 不可用（隐私模式等），保持默认深色
    }
    setThemeState(initial);
    setReady(true);
  }, []);

  // 同步到 <html class="dark">
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, ready, setTheme, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
