import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#f4e401", // GISUL yellow
        secondary: "#6952a2", // GISUL purple
        cream: "#f1dcba", // GISUL cream
        dark: "#1a1a2e", // deep navy background
      },
    },
  },
  plugins: [],
} satisfies Config;

