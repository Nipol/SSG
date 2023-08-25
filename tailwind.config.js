/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    'template/*.html',
  ],
  safelist: [
    'bg-coralpink',
    'bg-coralpink/30',
    'text-coralpink',
    'text-fuchsia-700',
    'text-slate-800',
    'text-amber-700',
    'bg-amber-700',
    'bg-amber-700/30',
    'bg-slate-800',
    'bg-slate-800/30',
    'bg-fuchsia-700',
    'bg-fuchsia-700/30',
    'bg-purplenight',
    'bg-purplenight/30',
    'text-purplenight',
  ],
  theme: {
    extend: {
      colors: {
        purplenight: '#624296',
        coralpink: '#FF5A5A',
      },
    },
  },
  plugins: [],
};
