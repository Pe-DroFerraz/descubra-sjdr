import type { Config } from 'tailwindcss';
export default { content: ['./index.html', './src/**/*.{ts,tsx}'], theme: { extend: { colors: { colonial: '#173c58', ochre: '#c69847', clay: '#b66851', ivory: '#faf6ed' }, fontFamily: { display: ['Georgia', 'serif'] } } }, plugins: [] } satisfies Config;
