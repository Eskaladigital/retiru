import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Terracotta
        terracotta: {
          50: '#fdf5f0',
          100: '#fae8db',
          200: '#f4cdb6',
          300: '#ecac87',
          400: '#e28a5c',
          500: '#d97040',
          600: '#c85a30',
          700: '#a64728',
          800: '#853a26',
          900: '#6c3222',
        },
        // Sage
        sage: {
          50: '#f4f7f4',
          100: '#e4ebe4',
          200: '#c9d7ca',
          300: '#a3baa5',
          400: '#7a9a7d',
          500: '#5c7f60',
          600: '#47654b',
          700: '#3a513e',
          800: '#314234',
          900: '#29372c',
          950: '#1e2a20',
        },
        // Sand
        sand: {
          50: '#fdfcf9',
          100: '#f9f5ed',
          200: '#f2e9d6',
          300: '#e8d7b8',
          400: '#dbbf93',
          500: '#d0a876',
          600: '#b88d5a',
          700: '#9a6f45',
          800: '#7a5738',
          900: '#5d432f',
        },
        // Cream
        cream: {
          DEFAULT: '#fefdfb',
          50: '#fefdfb',
          100: '#fcf9f3',
          200: '#f8f2e6',
        },
        // Semantic aliases
        background: '#fefdfb',
        foreground: '#2d2319',
        'muted-foreground': '#7a6b5d',
        border: '#e8d7b8',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(45,35,25,.06)',
        'soft': '0 4px 20px rgba(45,35,25,.08)',
        'elevated': '0 10px 40px rgba(45,35,25,.12)',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
};

export default config;
