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
        teleport: {
          dark: "#090D16",
          card: "#0F172A",
          surface: "#1E293B",
          border: "#334155",
          accent: "#6366F1",
          emerald: "#22C55E",
          amber: "#F59E0B",
          crimson: "#EF4444",
          cyan: "#06B6D4"
        }
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "border-glow": "borderGlow 4s ease infinite"
      },
      keyframes: {
        borderGlow: {
          "0%, 100%": { borderColor: "rgba(99, 102, 241, 0.4)" },
          "50%": { borderColor: "rgba(34, 197, 94, 0.4)" }
        }
      }
    }
  },
  plugins: []
};

