/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8B2525',
        'primary-dark': '#1C0606',
        background: '#FAF8F5',
        surface: '#FFFFFF',
        'surface-variant': '#F3EEE7',
        'on-surface': '#1E1B1A',
        'on-surface-variant': '#504443',
        'outline-variant': '#E1D8D7',
        error: '#BA1A1A',
        success: '#0F6E56',
        warning: '#854F0B',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(28, 6, 6, 0.06), 0 1px 3px 0 rgba(28, 6, 6, 0.08)',
        popover: '0 12px 32px -8px rgba(28, 6, 6, 0.28)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
