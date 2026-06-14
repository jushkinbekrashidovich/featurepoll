import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "#FBFAF9",
        surface: "#FFFFFF",
        muted: "#FAF6F0",
        border: "#EFE7DC",
        accent: {
          DEFAULT: "#E16540",
          tint: "#FAECE7",
          text: "#993C1D",
        },
        text: {
          DEFAULT: "#1A1A1A",
          muted: "#57534E",
          faint: "#8A8279",
        },
        success: "#1D9E75",
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "Fira Code", "monospace"],
      },
      maxWidth: {
        page: "1080px",
      },
      borderRadius: {
        btn: "11px",
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
