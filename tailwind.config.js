/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core palette
        paper:          '#fdf8f0',
        ink:            '#1a1410',
        primary:        '#c8f060',
        'primary-dark': '#8ab800',
        dim:            '#6b6862',

        // Extended
        coral:          '#ff7b54',
        'coral-light':  '#fff3ef',
        surface:        '#f2ece0',
        'surface-2':    '#e8e2d4',
        border:         '#e0dbd0',
        muted:          '#8a8278',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono:  ['"DM Mono"', '"Courier New"', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(26,20,16,0.07), 0 1px 2px rgba(26,20,16,0.04)',
        md: '0 4px 16px rgba(26,20,16,0.09), 0 2px 4px rgba(26,20,16,0.05)',
        lg: '0 12px 40px rgba(26,20,16,0.11), 0 4px 8px rgba(26,20,16,0.07)',
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
}
