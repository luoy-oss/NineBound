import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "space-dark": "#0a0a1a",
        "space-mid": "#12122a",
        "purple-glow": "#8b5cf6",
        "purple-deep": "#6d28d9",
      },
    },
  },
  plugins: [],
};
export default config;
