/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Set 'Inter' as the default font
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      // Define our light, colorful theme
      colors: {
        'brand-light': '#ffffff', // White background
        'brand-dark': '#0F172A',  // Slate 900 for text
        'brand-gray': '#64748B',  // Slate 500 for secondary text
        'brand-primary': {
          light: '#3B82F6', // Blue 500
          DEFAULT: '#2563EB', // Blue 600
          dark: '#1D4ED8',  // Blue 700
        },
        'brand-secondary': {
          light: '#E0F2FE', // Sky 100 (light backgrounds)
          DEFAULT: '#BAE6FD', // Sky 200
          dark: '#7DD3FC',  // Sky 300
        },
        'brand-accent': {
          light: '#22D3EE', // Cyan 400
          DEFAULT: '#06B6D4', // Cyan 500
          dark: '#0E7490',  // Cyan 700
        },
        'brand-success': '#22C55E', // Green 500
        'brand-warning': '#F59E0B', // Amber 500
        'brand-error': '#EF4444',   // Red 500
      },
      // Add subtle ring for focus states
      ringColor: {
        DEFAULT: '#2563EB', // Blue 600
      },
    },
  },
  plugins: [],
}