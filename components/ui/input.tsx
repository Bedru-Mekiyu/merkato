import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            "w-full h-10 px-3 rounded-sm bg-background border border-border text-sm text-white placeholder:text-faint",
            "hover:border-white/20 focus:border-accent focus:ring-2 focus:ring-accent/30 outline-none transition-all duration-150",
            error && "border-danger/60 hover:border-danger focus:border-danger focus:ring-danger/25",
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
