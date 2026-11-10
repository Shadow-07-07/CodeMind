/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#080b11",
        surface: "#0e131f",
        panel: "#141a29",
        "panel-hover": "#1a2235",
        line: "#20293d",
        "line-bright": "#2e3b56",
        brand: {
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          cyan: "#06b6d4",
          violet: "#a855f7",
        },
        accent: "#4f46e5",
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(99, 102, 241, 0.25)",
        "glow-cyan": "0 0 25px -5px rgba(6, 182, 212, 0.25)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
