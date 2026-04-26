export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'monospace'],
      },
      colors: {
        surface: {
          0: "#0a0a0a",
          1: "#141414",
          2: "#1e1e1e",
          3: "#282828",
        },
        line: {
          DEFAULT: "rgba(255,255,255,0.10)",
          strong: "rgba(255,255,255,0.18)",
        },
        txt: {
          primary: "#f0f0f0",
          secondary: "#a0a0a0",
          muted: "#6b6b6b",
        },
        accent: {
          red: "#ef4444",
          green: "#22c55e",
          yellow: "#eab308",
          blue: "#3b82f6",
        },
        gray: {
          950: "#0a0a0a",
          900: "#141414",
          800: "rgba(255,255,255,0.10)",
          700: "rgba(255,255,255,0.18)",
          600: "#a0a0a0",
          500: "#b0b0b0",
          400: "#d0d0d0",
          300: "#e0e0e0",
          200: "#ebebeb",
          100: "#f5f5f5",
          50: "#fafafa",
        },
      },
    },
  },
  plugins: [],
}