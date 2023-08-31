/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    'template/*.html',
  ],
  safelist: [
    'md:w-1/2',
    'mx-auto',
    'text-purplenight',
    'text-coralpink',
    'text-fuchsia-700',
    'text-slate-800',
    'text-amber-700',
    'text-teal-900',
    'text-pink-950',
    'bg-coralpink',
    'bg-coralpink/30',
    'bg-amber-700',
    'bg-amber-700/30',
    'bg-slate-800',
    'bg-slate-800/30',
    'bg-fuchsia-700',
    'bg-fuchsia-700/30',
    'bg-purplenight',
    'bg-purplenight/30',
    'bg-teal-900',
    'bg-teal-900/30',
    'bg-pink-950',
    'bg-pink-950/30',
  ],
  theme: {
    extend: {
      height: {
        '128': '32rem',
        '144': '40rem',
        '160': '48rem',
      },
      colors: {
        purplenight: '#624296',
        coralpink: '#FF5A5A',
      },
    },
  },
  plugins: [],
};
