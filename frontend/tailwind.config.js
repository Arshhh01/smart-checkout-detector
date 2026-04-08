export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          950: "#000000",
          900: "#050505",
          800: "rgba(255, 255, 255, 0.25)",
          700: "rgba(255, 255, 255, 0.30)",
          600: "#b0b0b0",
          500: "#c0c0c0",
          400: "#d4d4d4",
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