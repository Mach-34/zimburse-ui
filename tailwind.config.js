/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        zimburseBlue: '#489CFF',
        zimburseGray: '#D9D9D9',
      },
    },
  },
  plugins: [],
};
