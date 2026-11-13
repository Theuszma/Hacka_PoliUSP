import type { Config } from "tailwindcss";

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        surface: v("surface"),
        sunken: v("sunken"),
        ink: v("ink"),
        muted: v("muted"),
        line: v("line"),
        accent: { DEFAULT: v("accent"), ink: v("accent-ink"), soft: v("accent-soft") },
        ochre: { DEFAULT: v("ochre"), soft: v("ochre-soft") },
        good: { DEFAULT: v("good"), soft: v("good-soft") },
        bad: { DEFAULT: v("bad"), soft: v("bad-soft") },
      },
      fontFamily: {
        display: ["Archivo", "Helvetica Neue", "Arial", "sans-serif"],
        sans: ["IBM Plex Sans", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: { card: "12px" },
    },
  },
  plugins: [],
} satisfies Config;
