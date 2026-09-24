/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bizlink: {
          navy: {
            DEFAULT: '#0B2541',
            dark: '#071B30',
            light: '#102F52',
            subtle: '#1C3A5E'
          },
          turquoise: {
            DEFAULT: '#31B8C1',
            hover: '#279CA4',
            light: '#E6F7F8',
            subtle: '#F0FBFC'
          },
          bg: '#F5F8FA',
          card: '#FFFFFF',
          text: '#172554',
          muted: '#64748B',
          border: '#E2E8F0'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(11, 37, 65, 0.05), 0 1px 2px 0 rgba(11, 37, 65, 0.03)',
        'card': '0 4px 6px -1px rgba(11, 37, 65, 0.05), 0 2px 4px -1px rgba(11, 37, 65, 0.03)',
        'elevated': '0 10px 15px -3px rgba(11, 37, 65, 0.08), 0 4px 6px -2px rgba(11, 37, 65, 0.04)',
      }
    },
  },
  plugins: [],
}
