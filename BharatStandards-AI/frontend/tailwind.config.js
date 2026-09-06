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
        bharat: {
          50: '#f0f6fe',
          100: '#ddeafe',
          200: '#c2dbfd',
          300: '#98c3fc',
          400: '#67a0f8',
          500: '#3f7bf2',
          600: '#275ee6',
          700: '#1e48cb',
          800: '#1f3ea4',
          900: '#1e3881',
          950: '#0b1b44',
        },
        saffron: {
          50: '#fff8ed',
          100: '#feedd3',
          200: '#fdd8a7',
          300: '#fbbd70',
          400: '#f89a36',
          500: '#f57f14',
          600: '#e6650a',
          700: '#be4c0b',
          800: '#973c10',
          900: '#7a3411',
        },
        ashoka: '#000080',
        navy: {
          800: '#0f172a',
          900: '#0B2545',
          950: '#07162c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px -1px rgba(0, 0, 0, 0.07)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'premium': '0 10px 25px -5px rgba(11, 37, 69, 0.08), 0 8px 10px -6px rgba(11, 37, 69, 0.04)',
      },
    },
  },
  plugins: [],
}
