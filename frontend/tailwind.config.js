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
          0: "#000000",
          1: "#111111",
          2: "#1a1a1a",
          3: "#242424",
        },
        line: {
          DEFAULT: "rgba(255,255,255,0.15)",
          strong: "rgba(255,255,255,0.25)",
        },
        txt: {
          primary: "#ffffff",
          secondary: "#cccccc",
          muted: "#999999",
        },
        accent: {
          red: "#ef4444",
          green: "#22c55e",
          yellow: "#eab308",
          blue: "#3b82f6",
        },
        gray: {
          950: "#000000",
          900: "#111111",
          800: "rgba(255,255,255,0.15)",
          700: "rgba(255,255,255,0.25)",
          600: "#cccccc",
          500: "#cccccc",
          400: "#e0e0e0",
          300: "#eeeeee",
          200: "#f5f5f5",
          100: "#fafafa",
          50: "#ffffff",
        },
      },
    },
  },
  plugins: [],
}