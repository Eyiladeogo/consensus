import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        "primary-blue": "#2563EB",
        "secondary-indigo": "#4F46E5",
        "success-green": "#10B981",
        "error-red": "#EF4444",
        "neutral-bg": "#F9FAFB",
        "neutral-card": "#FFFFFF",
        "neutral-border": "#E5E7EB",
        "text-primary": "#1F2937",
        "text-secondary": "#4B5563",
        "text-accent-blue": "#3B82F6",
      },
      boxShadow: {
        "custom-sm": "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        "custom-md":
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "custom-lg":
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
