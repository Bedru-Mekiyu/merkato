"use client";

import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

export function ThemeSelector({
  className,
}: {
  variant?: "button" | "compact" | "full";
  align?: "left" | "right";
  className?: string;
}) {
  const { theme, setTheme, themes } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Color theme switcher"
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-white/[0.08] bg-surface/80 backdrop-blur-md shadow-sm select-none",
        className
      )}
    >
      {themes.map((t) => {
        const active = theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t.name}
            title={`${t.name} (${t.category})`}
            onClick={() => setTheme(t.id)}
            className={cn(
              "relative h-4 w-4 rounded-full transition-all duration-200 focus-visible:outline-none shrink-0",
              active
                ? "scale-110 ring-2 ring-white ring-offset-1 ring-offset-background shadow-[0_0_10px_currentColor]"
                : "opacity-60 hover:opacity-100 hover:scale-105"
            )}
            style={{
              backgroundColor: t.primaryColor,
              color: t.primaryColor,
            }}
          />
        );
      })}
    </div>
  );
}
