import { defineConfig } from 'vitest/config'

// Security-rule tests. They need the Firestore Emulator, so run them with
// `npm run test:rules`, which starts the emulator, runs these and stops it again.
export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts'],
    environment: 'node',
    // All tests share one emulator database, so run files one after another.
    fileParallelism: false,
    testTimeout: 15_000,
  },
})
