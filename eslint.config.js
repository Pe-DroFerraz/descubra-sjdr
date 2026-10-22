import js from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', '**/*.tsbuildinfo', 'vite.config.d.ts', 'vite.config.js'] },
  { files: ['**/*.cjs'], languageOptions: { globals: { module: 'readonly' } } },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['src/**/*.{ts,tsx}'], languageOptions: { globals: { localStorage: 'readonly', document: 'readonly' } } },
);
