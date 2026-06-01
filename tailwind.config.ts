import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sahelGreen: "#0F6B2D",
        sahelGold: "#F4A300",
        sahelBlack: "#0B1220"
      },
      boxShadow: {
        glow: "0 24px 80px rgba(244, 163, 0, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
