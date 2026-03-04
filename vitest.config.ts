import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Load test environment variables BEFORE any other imports
import { config } from 'dotenv';
config({ path: '.env.test' });

// Set environment variables globally for the test run
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://ywqjgusyluhchlvvtnlp.supabase.co';
process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_RsC53VHhXi1OkdGtcQqokg_fPq-GyXA';
process.env.NODE_ENV = 'test';

export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'server/**/*.test.ts',
      'tests/**/*.test.ts'
    ],
    exclude: [
      'node_modules/**',
      '.nuxt/**',
      'dist/**'
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