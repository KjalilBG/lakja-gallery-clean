import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        sand: "#f4efe7",
        gold: "#b58a52",
        muted: "#6d655d",
        panel: "#1a1a1a"
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"]
      },
      boxShadow: {
        soft: "0 20px 70px rgba(17, 17, 17, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
