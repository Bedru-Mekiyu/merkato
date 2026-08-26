import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#0A0A0B",
          light: "#FAFAFA",
        },
        surface: {
          DEFAULT: "#18181B",
          light: "#FFFFFF",
        },
        border: {
          DEFAULT: "#27272A",
          light: "#E5E7EB",
        },
        accent: {
          DEFAULT: "#6366F1",
          hover: "#5558E3",
          subtle: "rgba(99, 102, 241, 0.12)",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        muted: {
          DEFAULT: "rgba(255, 255, 255, 0.6)",
          light: "rgba(0, 0, 0, 0.6)",
        },
        faint: {
          DEFAULT: "rgba(255, 255, 255, 0.4)",
          light: "rgba(0, 0, 0, 0.4)",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
        modal: "0 8px 30px rgba(0, 0, 0, 0.5)",
        glow: "0 0 0 1px rgba(99, 102, 241, 0.15), 0 4px 24px rgba(99, 102, 241, 0.12)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97) translateY(-4px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
        "fade-in-up": "fade-in-up 350ms ease-out both",
        "scale-in": "scale-in 150ms ease-out",
        "slide-in-left": "slide-in-left 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
