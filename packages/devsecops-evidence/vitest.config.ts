import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Solo los tests en TypeScript. Sin este `include`, vitest tambien recoge
    // `dist/tests/*.js`, con lo que cada test se ejecuta dos veces y una copia
    // compilada obsoleta puede pasar mientras el fuente esta roto.
    include: ['tests/**/*.test.ts'],
  },
});
