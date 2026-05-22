/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#155DFC",
          50: "#EFF6FF",
          100: "#DBEAFE",
          500: "#155DFC",
          600: "#1E4AF6",
          700: "#1D3ED1",
        },
        accent: {
          neon: "#c5e302",
          neonLight: "#BBF451",
          neonDark: "#7CCF00",
          red: "#FB2C36",
          orange: "#F54802",
          yellow: "#F9F906",
        },
        danger: "#FB2C36",
        orange: "#F54802",
        yellow: "#F9F906",
        background: "#F9F2E6",
        cream: "#F9F2E6",
        "text-primary": "#1F1F1F",
        "text-secondary": "#8A8A8A",
      },
      fontFamily: {
        sans: ["Plus-Jakarta"],
        heading: ["Fjalla-One"],
      },
    },
  },
  plugins: [],
};
