import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantClasses: Record<string, string> = {
  primary:
    "bg-primary text-white border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.28),0_1px_3px_0_rgba(0,0,0,0.4)] hover:bg-primary-hover hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),0_0_15px_var(--primary-glow)] active:opacity-90 active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none transition-all duration-150",
  secondary:
    "bg-surface/80 border border-white/10 text-white/90 hover:bg-white/[0.07] hover:text-white hover:border-white/20 active:bg-white/[0.1] active:scale-[0.985] shadow-[0_1px_2px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:pointer-events-none transition-all duration-150",
  ghost:
    "bg-transparent text-white/70 hover:bg-white/[0.06] hover:text-white active:bg-white/[0.1] active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none transition-all duration-150",
  danger:
    "bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20 hover:border-danger/40 active:bg-danger/30 active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none transition-all duration-150",
  outline:
    "bg-transparent border border-white/15 text-white/90 hover:bg-white/[0.05] hover:border-white/30 active:bg-white/[0.1] active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none transition-all duration-150",
};

const sizeClasses: Record<string, string> = {
  sm: "h-8 px-3 text-xs font-medium rounded-md gap-1.5",
  md: "h-9 px-4 text-sm font-medium rounded-md gap-2",
  lg: "h-11 px-5 text-sm font-semibold rounded-lg gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, disabled, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
