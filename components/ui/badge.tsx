import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "primary" | "secondary" | "accent" | "outline";
  dot?: boolean;
}

const variantClasses: Record<string, string> = {
  default: "bg-white/[0.06] text-white/80 border-white/10",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]",
  warning: "bg-amber-500/10 text-amber-300 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]",
  danger: "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]",
  primary: "bg-primary/10 text-primary border-primary/25 shadow-[0_0_8px_var(--primary-glow)]",
  secondary: "bg-secondary/10 text-secondary border-secondary/25 shadow-[0_0_8px_rgba(168,85,247,0.15)]",
  accent: "bg-primary/10 text-primary border-primary/25 shadow-[0_0_8px_var(--primary-glow)]",
  outline: "bg-transparent text-white/70 border-white/15",
};

const dotClasses: Record<string, string> = {
  default: "bg-white/50",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-rose-400",
  primary: "bg-primary",
  secondary: "bg-secondary",
  accent: "bg-primary",
  outline: "bg-white/50",
};

export function Badge({ className, variant = "default", dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-tight border transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotClasses[variant])} />}
      {children}
    </span>
  );
}
