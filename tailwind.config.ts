/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pool: {
          50:  '#e6f4fb',
          100: '#b3ddf4',
          200: '#7fc5ec',
          300: '#4cade4',
          400: '#1a96dc',
          500: '#0077b6',
          600: '#005f8e',
          700: '#004766',
          800: '#002f3f',
          900: '#001720',
        },
        wave: {
          50:  '#e0f7f4',
          100: '#b3ece5',
          200: '#7dddd3',
          300: '#43cdc0',
          400: '#00b4d8',
          500: '#0096c7',
          600: '#007a9e',
          700: '#005f78',
          800: '#004457',
          900: '#002a38',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body:    ['var(--font-body)',    'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)',    'monospace'],
      },
      animation: {
        'slide-up':   'slideUp 0.4s ease-out',
        'fade-in':    'fadeIn 0.3s ease-out',
        'wave-slow':  'wave 8s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        wave: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%':      { transform: 'translateX(-25%)' },
        },
      },
    },
  },
  plugins: [],
}
