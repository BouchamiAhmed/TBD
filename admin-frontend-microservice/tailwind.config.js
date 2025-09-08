/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          primary: '#dc2626',
          secondary: '#991b1b',
          accent: '#fca5a5',
        }
      }
    },
  },
  plugins: [],
}