import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    include: [
      'server/**/*.test.ts',
      'tests/**/*.test.ts'
    ],
    exclude: [
      'node_modules/**',
      '.nuxt/**',
      'dist/**',
      'tests/server/**/*.test.ts' // Exclude full Nuxt integration tests for now
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.nuxt/',
        'dist/',
        '**/*.config.ts',
        '**/*.d.ts'
      ]
    }
  }
});
