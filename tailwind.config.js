/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        notion: {
          bg: '#FFFFFF',
          darkBg: '#191919',
          sidebar: '#F7F7F5',
          border: '#E9E9E7',
          hover: '#EFEFED',
          text: '#37352F',
          muted: '#787774',
          accent: '#2383E2'
        }
      }
    },
  },
  plugins: [],
}
