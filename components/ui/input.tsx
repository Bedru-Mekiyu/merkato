import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-white mb-1.5">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full h-9 px-3 rounded-md bg-black/40 border border-white/10 text-sm text-white placeholder:text-white/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]",
            "hover:border-white/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-150",
            error && "border-rose-500/50 hover:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
