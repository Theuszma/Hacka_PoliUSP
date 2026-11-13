import type { Config } from "tailwindcss";

const c = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      colors: {
        border: c("border"),
        input: c("input"),
        ring: c("ring"),
        background: c("background"),
        foreground: c("foreground"),
        subtle: c("subtle"),
        primary: { DEFAULT: c("primary"), foreground: c("primary-foreground") },
        muted: { DEFAULT: c("muted"), foreground: c("muted-foreground") },
        card: { DEFAULT: c("card"), foreground: c("card-foreground") },
        popover: { DEFAULT: c("popover"), foreground: c("popover-foreground") },
        brand: { DEFAULT: c("brand"), foreground: c("brand-foreground"), soft: c("brand-soft") },
        success: { DEFAULT: c("success"), soft: c("success-soft") },
        warning: { DEFAULT: c("warning"), soft: c("warning-soft") },
        danger: { DEFAULT: c("danger"), soft: c("danger-soft") },
        info: { DEFAULT: c("info"), soft: c("info-soft") },
      },
      fontFamily: {
        sans: ["Geist", "Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: { lg: "10px", md: "8px", sm: "6px" },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.03)",
        pop: "0 10px 38px -10px rgb(22 23 24 / 0.25), 0 10px 20px -15px rgb(22 23 24 / 0.15)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "zoom-in": { from: { opacity: "0", transform: "translate(-50%,-48%) scale(.97)" }, to: { opacity: "1", transform: "translate(-50%,-50%) scale(1)" } },
        "slide-down": { from: { opacity: "0", transform: "translateY(-4px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in-left": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
      },
      animation: {
        "fade-in": "fade-in .15s ease-out",
        "zoom-in": "zoom-in .18s cubic-bezier(.16,1,.3,1)",
        "slide-down": "slide-down .15s ease-out",
        "slide-in-left": "slide-in-left .2s cubic-bezier(.16,1,.3,1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
