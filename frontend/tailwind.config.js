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
          800: "rgba(255, 255, 255, 0.28)",
          700: "rgba(255, 255, 255, 0.35)",
          600: "#cccccc",
          500: "#d9d9d9",
          400: "#e5e5e5",
          300: "#efefef",
          200: "#f5f5f5",
          100: "#fafafa",
          50: "#ffffff",
        },
      },
    },
  },
  plugins: [],
}