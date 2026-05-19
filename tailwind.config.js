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
        primary: "#155DFC",
        accent: {
          DEFAULT: "#cfff04",
          light: "#cfff04",
          dark: "#7CCF00",
        },
        danger: "#FB2C36",
        orange: "#F54802",
        yellow: "#F9F906",
        background: "#F9F2E6",
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
