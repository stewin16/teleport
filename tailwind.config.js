/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bedrock: "#0B0F17",
        surface: {
          DEFAULT: "#101623",
          hover: "#141C2C",
          elevated: "#182236",
          active: "#1E2B44"
        },
        rule: {
          subtle: "#1B2434",
          DEFAULT: "#26334A",
          strong: "#3B4D6D"
        },
        ink: {
          DEFAULT: "#F1F5F9",
          muted: "#94A3B8",
          faint: "#64748B",
          inverse: "#0B0F17"
        },
        signal: {
          DEFAULT: "#A3E635",
          hover: "#BEF264",
          dim: "rgba(163, 230, 53, 0.10)",
          border: "rgba(163, 230, 53, 0.30)",
          solid: "#65A30D"
        },
        danger: {
          DEFAULT: "#F43F5E",
          hover: "#FB7185",
          dim: "rgba(244, 63, 94, 0.10)",
          border: "rgba(244, 63, 94, 0.30)"
        },
        warn: {
          DEFAULT: "#F59E0B",
          hover: "#FBBF24",
          dim: "rgba(245, 158, 11, 0.10)",
          border: "rgba(245, 158, 11, 0.30)"
        },
        telemetry: {
          DEFAULT: "#38BDF8",
          dim: "rgba(56, 189, 248, 0.10)",
          border: "rgba(56, 189, 248, 0.30)"
        }
      },
      fontFamily: {
        sans: ["Geologica", "IBM Plex Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Geologica", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"]
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.025em",
        tight: "-0.015em",
        normal: "0em",
        wide: "0.02em"
      }
    }
  },
  plugins: []
};
