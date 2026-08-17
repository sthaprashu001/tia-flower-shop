import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: "#FFFBF6",
        sand: "#F1E4D6",
        charcoal: "#262321",
        rose: {
          DEFAULT: "#B3294F",
          dark: "#8C1F3E",
          light: "#F6DCE0",
        },
        sage: {
          DEFAULT: "#4B5D46",
          dark: "#374332",
          light: "#DCE5D6",
        },
        board: {
          DEFAULT: "#1B1F2A",
          light: "#2A2F3D",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "0.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
