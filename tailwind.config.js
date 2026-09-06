/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        night: {
          900: "#0d0d16",
          800: "#121212",
          700: "#1a1a2e",
          600: "#232338",
          500: "#2c2c45",
          400: "#3a3a58",
        },
        pastel: {
          pink: "#FFB6C1",
          purple: "#C9A0DC",
          blue: "#A0C4FF",
          mint: "#9FE2B9",
          amber: "#FFD9A0",
          rose: "#FF8FA3",
        },
        ink: {
          DEFAULT: "#EDEAF6",
          dim: "#B9B4CF",
          faint: "#8d88a6",
        },
      },
      fontFamily: {
        gothic: ["Cinzel", "Georgia", "serif"],
        display: [
          '"Nunito Variable"',
          "Nunito",
          "system-ui",
          "-apple-system",
          '"Segoe UI"',
          "sans-serif",
        ],
        body: [
          '"Inter Variable"',
          "Inter",
          "system-ui",
          "-apple-system",
          '"Segoe UI"',
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "16px",
        btn: "12px",
      },
      boxShadow: {
        "glow-pink": "0 0 24px rgba(255,182,193,0.25)",
        "glow-purple": "0 0 28px rgba(201,160,220,0.30)",
        "glow-blue": "0 0 24px rgba(160,196,255,0.25)",
        card: "0 10px 34px rgba(0,0,0,0.38)",
        sticker: "0 6px 22px rgba(0,0,0,0.45)",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0) rotate(var(--tilt,0deg))" },
          "50%": { transform: "translateY(-10px) rotate(var(--tilt,0deg))" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        fadeUp: "fadeUp .5s ease-out both",
        pulseSoft: "pulseSoft 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
