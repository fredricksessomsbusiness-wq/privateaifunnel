import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          accent: "#D97706",
          hover: "#B45309",
          tint: "rgba(217,119,6,0.1)",
          border: "rgba(217,119,6,0.35)",
          text: "#222222",
          bg: "#F8FAFA",
          white: "#FFFFFF",
        },
      },
      fontFamily: {
        heading: ["var(--font-playfair)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 16px 40px rgba(15, 23, 42, 0.08)",
      },
      maxWidth: {
        container: "1280px",
      },
      borderRadius: {
        brand: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
