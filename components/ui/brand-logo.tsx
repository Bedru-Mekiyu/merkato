import React from "react";
import { cn } from "@/lib/utils";

export function MerkatoWordmark({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-bold tracking-tight text-white select-none transition-colors duration-200 group-hover:text-primary",
        size === "sm" && "text-base",
        size === "md" && "text-lg",
        size === "lg" && "text-2xl",
        size === "xl" && "text-3xl",
        className
      )}
    >
      Merkato
    </span>
  );
}

export function MerkatoLogo({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return <MerkatoWordmark size={size} className={className} />;
}

export function MerkatoMark({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeMap = {
    sm: "h-6 w-6 rounded-md",
    md: "h-8 w-8 rounded-lg",
    lg: "h-10 w-10 rounded-xl",
    xl: "h-12 w-12 rounded-xl",
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center bg-gradient-to-br from-primary via-primary-hover to-secondary p-[1px] shadow-[0_0_12px_var(--primary-glow)] shrink-0 transition-transform duration-200 group-hover:scale-105",
        sizeMap[size],
        className
      )}
      aria-hidden="true"
    >
      <div className="h-full w-full rounded-[inherit] bg-surface flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-[55%] w-[55%] text-white"
        >
          <path
            d="M4 19V5L12 13L20 5V19"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 13V19"
            stroke="var(--primary)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
export const BrandMark = MerkatoMark;
