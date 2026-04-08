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
          1: "#111111",
          2: "#181818",
          3: "#222222",
        },
        line: {
          DEFAULT: "rgba(255,255,255,0.07)",
          strong: "rgba(255,255,255,0.12)",
        },
        txt: {
          primary: "#e8e8e8",
          secondary: "#8a8a8a",
          muted: "#555555",
        },
        accent: {
          red: "#e53e3e",
          green: "#38a169",
          yellow: "#d69e2e",
          blue: "#3182ce",
        },
      },
    },
  },
  plugins: [],
}