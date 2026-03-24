/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f2efe8',
        ink: '#0e0d0b',
        primary: '#c8f060',
        'primary-dark': '#8ab800',
        dim: '#6b6862',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"DM Mono"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
}
