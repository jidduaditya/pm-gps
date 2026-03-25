import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

config();

export default defineConfig({
  test: {
    testTimeout: 60_000,
    hookTimeout: 30_000,
    include: ['src/test/e2e/**/*.test.ts'],
    env: {
      ...process.env as Record<string, string>,
    },
  },
});
