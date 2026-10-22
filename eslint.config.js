import js from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      '.audit/**',
      '**/*.tsbuildinfo',
      'vite.config.d.ts',
      'vite.config.js',
    ],
  },
  { files: ['**/*.cjs'], languageOptions: { globals: { module: 'readonly' } } },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        fetch: 'readonly',
        AbortSignal: 'readonly',
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { localStorage: 'readonly', document: 'readonly' },
    },
  },
);
