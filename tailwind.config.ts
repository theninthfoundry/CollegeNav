import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        s1: "var(--surface-1)",
        s2: "var(--surface-2)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        ink: {
          DEFAULT: "var(--ink)",
          2: "var(--ink-2)",
          3: "var(--ink-3)",
          4: "var(--ink-4)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          tint: "var(--accent-tint)",
          line: "var(--accent-line)",
        },
        ok: {
          DEFAULT: "var(--ok)",
          tint: "var(--ok-tint)",
        },
        warn: {
          DEFAULT: "var(--warn)",
          tint: "var(--warn-tint)",
        },
        crit: {
          DEFAULT: "var(--crit)",
          tint: "var(--crit-tint)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          tint: "var(--muted-tint)",
        },
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        sheet: "20px",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
      },
      boxShadow: {
        float: "var(--float)",
      },
    },
  },
  plugins: [],
};

export default config;
