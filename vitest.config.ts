import { defineConfig } from 'vitest/config'

// Unit tests for the app's logic (names, seasons, time). Run with `npm test`.
// Security-rule tests have their own config: vitest.rules.config.ts.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
