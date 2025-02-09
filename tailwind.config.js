/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    'template/*.html',
  ],
  safelist: [
    'md:w-1/2',
    'md:w-1/3',
    'mx-auto',
    'text-slate-300',
    'text-slate-800',
    'text-gray-950',
    'dark:bg-coralpink',
    'bg-coralpink/30',
    'dark:bg-amber-700',
    'bg-amber-700/30',
    'dark:bg-slate-800',
    'bg-slate-800/30',
    'dark:bg-fuchsia-700',
    'bg-fuchsia-700/30',
    'dark:bg-purplenight',
    'bg-purplenight/30',
    'dark:bg-teal-900',
    'bg-teal-900/30',
    'dark:bg-pink-950',
    'bg-pink-950/30',
    'dark:bg-teal-950',
    'bg-teal-950/30',
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
