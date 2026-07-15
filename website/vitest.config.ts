import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
  },
});
