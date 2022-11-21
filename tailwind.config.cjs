/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      borderWidth: {
        '1': '1px'
      },
      scale: {
        '80': 'transform: scale(0.80)',
        '85': 'transform: scale(0.85)',
      }
    },
  },
  plugins: [],
}
