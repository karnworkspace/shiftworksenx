import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        shift: {
          day1: '#10b981',
          day2: '#3b82f6',
          day3: '#f59e0b',
          night: '#8b5cf6',
          off: '#6b7280',
          absent: '#ef4444',
          sick: '#ec4899',
          personal: '#f97316',
          vacation: '#06b6d4',
        },
      },
    },
  },
  plugins: [],
};

export default config;
