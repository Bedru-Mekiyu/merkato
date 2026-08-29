"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

export interface ThemeDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  primaryColor: string;
  surfaceColor: string;
  bgColor: string;
  accentGradient: string;
  badgeTone: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "moodle-cobalt",
    name: "Cobalt Slate",
    category: "Signature Dark",
    description: "Deep obsidian slate with electric cobalt accents & crisp high-contrast cards.",
    primaryColor: "#2563eb",
    surfaceColor: "#0f172a",
    bgColor: "#090e1a",
    accentGradient: "from-blue-600 via-indigo-600 to-sky-500",
    badgeTone: "sky",
  },
  {
    id: "cyber-indigo",
    name: "Cyber Aurora",
    category: "Neon Indigo",
    description: "Deep obsidian with glowing indigo & violet neon highlights.",
    primaryColor: "#6366f1",
    surfaceColor: "#141418",
    bgColor: "#09090b",
    accentGradient: "from-indigo-500 via-indigo-600 to-violet-600",
    badgeTone: "indigo",
  },
  {
    id: "emerald-matrix",
    name: "Emerald Matrix",
    category: "Jade & Mint",
    description: "Futuristic mint and emerald green over deep jade obsidian surfaces.",
    primaryColor: "#10b981",
    surfaceColor: "#0b1c15",
    bgColor: "#050e0a",
    accentGradient: "from-emerald-500 via-teal-600 to-cyan-500",
    badgeTone: "emerald",
  },
  {
    id: "nordic-frost",
    name: "Nordic Frost",
    category: "Ice Titanium",
    description: "Crisp titanium slate with cyan ice glows and ultra-clean structure.",
    primaryColor: "#06b6d4",
    surfaceColor: "#111827",
    bgColor: "#090d16",
    accentGradient: "from-cyan-500 via-sky-600 to-indigo-500",
    badgeTone: "sky",
  },
];

interface ThemeContextType {
  theme: string;
  themeDef: ThemeDefinition;
  setTheme: (themeId: string) => void;
  themes: ThemeDefinition[];
  clickTime: number | null;
  recordClick: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "merkato_theme_preference";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<string>("moodle-cobalt");
  const [clickTime, setClickTime] = useState<number | null>(null);

  const applyTheme = useCallback((themeId: string) => {
    const validTheme = THEMES.find((t) => t.id === themeId) ? themeId : "moodle-cobalt";
    setThemeState(validTheme);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", validTheme);
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem(THEME_STORAGE_KEY, validTheme);
      } catch {
        // Ignore storage error
      }
    }
  }, []);

  const recordClick = useCallback(() => {
    const start = performance.now();
    requestAnimationFrame(() => {
      const elapsed = Math.max(1, Math.round(performance.now() - start));
      setClickTime(elapsed);
    });
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && THEMES.some((t) => t.id === saved)) {
        applyTheme(saved);
      } else {
        applyTheme("moodle-cobalt");
      }
    } catch {
      applyTheme("moodle-cobalt");
    }
  }, [applyTheme]);

  useEffect(() => {
    function handleGlobalClick() {
      recordClick();
    }
    window.addEventListener("click", handleGlobalClick, { capture: true, passive: true });
    return () => {
      window.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, [recordClick]);

  const currentDef = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeDef: currentDef,
        setTheme: applyTheme,
        themes: THEMES,
        clickTime,
        recordClick,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
