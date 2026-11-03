
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      colors: {
        dairy: {
          background: "#181818",
          surface: "#222222",
          hover: "#292929",
          text: "#E7E7E7",
          muted: "#A3A3A3",
          border: "#383838",
          accent: "#86efac",
        },
      },
    },
  },

  plugins: [],
};
