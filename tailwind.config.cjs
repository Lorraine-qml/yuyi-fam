const path = require('path')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.join(__dirname, 'index.html').replace(/\\/g, '/'),
    path.join(__dirname, 'src/**/*.{vue,js,ts,jsx,tsx}').replace(/\\/g, '/')
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81'
        },
        gray: {
          50: '#f5f7fb',
          100: '#eef2f6',
          200: '#e4e7ec',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#5b6871',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827'
        },
        success: { DEFAULT: '#10b981', light: '#ecfdf5' },
        warning: { DEFAULT: '#f59e0b', light: '#fef3c7' },
        danger: { DEFAULT: '#ef4444', light: '#fef2f2' },
        brand: '#4f46e5'
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px'
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        card: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'card-hover': '0 8px 16px -8px rgb(15 23 42 / 0.2)'
      }
    }
  },
  plugins: []
}
