import type { Config } from 'tailwindcss';
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        colonial: '#173c58',
        ochre: '#d0a45b',
        clay: '#9e4b38',
        ivory: '#faf6ed',
      },
      fontFamily: { display: ['Georgia', 'serif'] },
    },
  },
  plugins: [],
} satisfies Config;
