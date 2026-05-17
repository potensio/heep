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
        primary: "#F04E30",
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
