/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        ink: {
          950: "#070708",
          900: "#0a0a0b",
          800: "#111114",
          700: "#16161a",
          600: "#1c1c22",
          500: "#26262e",
        },
        accent: {
          DEFAULT: "#FCD34D",
          glow: "#F59E0B",
        },
        signal: "rgb(var(--signal) / <alpha-value>)",
      },
      fontFamily: {
        sans: ['"Geist"', '"Onest"', "system-ui", "sans-serif"],
        display: ['"Space Grotesk"', '"Geist"', "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
      },
      backgroundImage: {
        "grain": "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/></svg>\")",
      },
      animation: {
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(252,211,77,0.5)" },
          "50%": { boxShadow: "0 0 0 12px rgba(252,211,77,0)" },
        },
      },
    },
  },
  plugins: [],
};
