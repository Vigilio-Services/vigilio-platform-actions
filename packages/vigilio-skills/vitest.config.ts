import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['assets/**', 'dist/**', 'node_modules/**', 'fixtures/**'],
    pool: 'threads',
  },
});
