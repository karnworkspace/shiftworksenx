import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/._*'],
    setupFiles: ['src/__tests__/setup.ts'],
    testTimeout: 10000,
  },
});
