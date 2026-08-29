"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, Loader2, SearchX, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/components/layout/sidebar";
import { useTheme } from "@/lib/theme-context";
import type { SearchResponse, SearchResultItem } from "@/lib/search";

interface Command {
  id: string;
  label: string;
  href?: string;
  hint?: string;
  icon: (typeof navItems)[number]["icon"] | typeof Palette;
  onSelect?: () => void;
}

const staticNavCommands: Command[] = [
  ...navItems.map((item) => ({
    id: item.href,
    label: item.label,
    href: item.href,
    icon: item.icon,
  })),
  { id: "/settings", label: "Settings", href: "/settings", icon: navItems[0].icon },
  {
    id: "/settings/invites",
    label: "Invite teammates",
    href: "/settings/invites",
    hint: "Owner / admin",
    icon: navItems[0].icon,
  },
  {
    id: "/settings/mfa",
    label: "Two-factor authentication",
    href: "/settings/mfa",
    hint: "Security",
    icon: navItems[0].icon,
  },
];

interface FlatResult extends SearchResultItem {
  typeLabel: string;
}

/**
 * Global command palette (⌘K / Ctrl+K). Static navigation commands are
 * matched instantly; typing two or more characters also searches live
 * workspace data (CRM, projects, KB, support) via /api/search.
 */
export function CommandPalette() {
  const router = useRouter();
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [remoteGroups, setRemoteGroups] = useState<SearchResponse["groups"]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim().toLowerCase();

  const themeCommands = useMemo<Command[]>(() => {
    return themes.map((t) => ({
      id: `theme-${t.id}`,
      label: `Switch Theme: ${t.name}`,
      hint: theme === t.id ? "Active Theme" : t.category,
      icon: Palette,
      onSelect: () => setTheme(t.id),
    }));
  }, [themes, theme, setTheme]);

  const allCommands = useMemo(() => {
    return [...staticNavCommands, ...themeCommands];
  }, [themeCommands]);

  const navResults = useMemo(() => {
    if (!trimmed) return allCommands;
    return allCommands.filter((c) => c.label.toLowerCase().includes(trimmed));
  }, [trimmed, allCommands]);

  const remoteResults = useMemo<FlatResult[]>(() => {
    if (!trimmed || trimmed.length < 2) return [];
    return remoteGroups.flatMap((g) =>
      g.items.map((item) => ({ ...item, typeLabel: g.label }))
    );
  }, [trimmed, remoteGroups]);

  // Flatten for keyboard navigation order
  const flatNav = useMemo(
    () => navResults.map((c) => ({ kind: "nav" as const, command: c })),
    [navResults]
  );

  const totalCount = flatNav.length + remoteResults.length;

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    setRemoteGroups([]);
  }, []);

  // Reset active index when result sets change
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(totalCount - 1, 0)));
  }, [totalCount]);

  // Debounced live search
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setRemoteGroups([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as SearchResponse;
        setRemoteGroups(data.groups ?? []);
      } catch {
        if (!controller.signal.aborted) setRemoteGroups([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, open]);

  // Global shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus input when opened + scroll lock
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleSelect(command: Command) {
    close();
    if (command.onSelect) {
      command.onSelect();
    } else if (command.href) {
      router.push(command.href);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(totalCount - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex < flatNav.length) {
        handleSelect(flatNav[activeIndex].command);
      } else {
        const r = remoteResults[activeIndex - flatNav.length];
        if (r) {
          close();
          router.push(r.href);
        }
      }
    }
  }

  let cursor = -1;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search (Ctrl+K)"
        className="flex items-center gap-2 text-xs sm:text-sm text-white/50 hover:text-white/80 bg-surface/60 border border-white/10 hover:border-white/20 rounded-md px-3 py-1.5 w-full max-w-xs transition-all duration-150"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search or switch theme...</span>
        <span className="inline sm:hidden">Search...</span>
        <kbd className="ml-auto text-[10px] border border-white/15 rounded px-1.5 py-0.5 hidden sm:inline font-mono">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={close}
          />
          <div
            className="relative w-full max-w-lg rounded-xl border border-white/10 bg-surface shadow-2xl overflow-hidden animate-scale-in"
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-2 px-4 border-b border-border">
              <Search className="h-4 w-4 text-white/40 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Search workspace, jump to, or type 'theme'..."
                aria-label="Search"
                autoComplete="off"
                className="w-full h-12 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
              />
              {searching && (
                <Loader2 className="h-3.5 w-3.5 text-white/40 animate-spin shrink-0" />
              )}
              <kbd className="text-[11px] border border-border rounded px-1.5 py-0.5 text-white/40 shrink-0">
                esc
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-1.5">
              {flatNav.length === 0 && remoteResults.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <SearchX className="h-5 w-5 text-white/30 mx-auto mb-2" />
                  <p className="text-sm text-white/50">
                    {searching
                      ? "Searching…"
                      : `No matches for “${query}”`}
                  </p>
                </div>
              ) : (
                <>
                  {flatNav.length > 0 && (
                    <p className="px-3 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                      Commands &amp; Themes
                    </p>
                  )}
                  {flatNav.map(({ command }) => {
                    cursor += 1;
                    const i = cursor;
                    const Icon = command.icon;
                    return (
                      <button
                        key={command.id}
                        type="button"
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => handleSelect(command)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                          i === activeIndex
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-white/70 hover:text-white"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-left">{command.label}</span>
                        {command.hint && (
                          <span className="text-[11px] text-white/40 font-mono">{command.hint}</span>
                        )}
                        {i === activeIndex && (
                          <CornerDownLeft className="h-3.5 w-3.5 text-primary" />
                        )}
                      </button>
                    );
                  })}

                  {remoteResults.length > 0 && (
                    <p className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-faint">
                      In your workspace
                    </p>
                  )}
                  {remoteResults.map((r) => {
                    cursor += 1;
                    const i = cursor;
                    return (
                      <button
                        key={`${r.typeLabel}-${r.id}`}
                        type="button"
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => {
                          close();
                          router.push(r.href);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                          i === activeIndex
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-white/70 hover:text-white"
                        )}
                      >
                        <span className="h-4 w-4 shrink-0 rounded-[3px] bg-white/10 flex items-center justify-center text-[8px] font-bold uppercase text-white/70">
                          {r.typeLabel.charAt(0)}
                        </span>
                        <span className="flex-1 text-left truncate">{r.title}</span>
                        {r.subtitle && (
                          <span className="text-[11px] text-faint truncate max-w-32">
                            {r.subtitle}
                          </span>
                        )}
                        <span className="text-[11px] text-faint hidden group-hover:inline">
                          {r.typeLabel}
                        </span>
                        {i === activeIndex && (
                          <CornerDownLeft className="h-3.5 w-3.5 text-faint shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[11px] text-faint">
              <span className="flex items-center gap-1">
                <kbd className="border border-border rounded px-1">↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="border border-border rounded px-1">↵</kbd> open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="border border-border rounded px-1">esc</kbd> close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
