import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { mono: ["'SF Mono'", 'Menlo', 'monospace'] },
      colors: {
        bg: '#0a0d12',
        surface: '#11151c',
        edge: '#2a323d',
        muted: '#8b949e',
        primary: '#e6edf3',
        nvidia: '#3fb950',
        amd: '#f85149',
        warn: '#ff7b72',
        good: '#7ee787',
      },
    },
  },
  plugins: [],
} satisfies Config;
