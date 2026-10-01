/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36abf7',
          500: '#0c8fe9',
          600: '#0171c7',
          700: '#015aa2',
          800: '#064d84',
          900: '#0b416e',
          950: '#072a4a',
        },
        navy: {
          50: '#f4f6fb',
          100: '#e8edf6',
          200: '#ced9ed',
          300: '#a3bcde',
          400: '#729bc9',
          500: '#4f7db4',
          600: '#3c6396',
          700: '#31507b',
          800: '#2b4467',
          900: '#0f172a',
          950: '#0a0f1d',
        },
        luxury: {
          gold: '#cda851',
          goldHover: '#b8943e',
          champagne: '#f8f4ec',
          darkCard: '#131b2e',
          darkBorder: '#1e293b',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'premium': '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        'glow': '0 0 25px -5px rgba(12, 143, 233, 0.25)',
        'dark-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
