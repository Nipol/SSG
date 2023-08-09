/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "template/*.html"
  ],
  safelist: [
    'bg-coralpink',
    'bg-coralpink/30',
    'text-coralpink',
    'bg-purplenight',
    'bg-purplenight/30',
    'text-purplenight'
  ],
  theme: {
    extend: {
      colors: {
        purplenight: '#624296',
        coralpink: "#FF5A5A"
      }
    }
  },
  plugins: [],
}

