// vitest.config.ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    setupFiles: ['tests/setup.ts'],
    environment: 'jsdom', // Use jsdom for DOM testing
  },
  resolve: {
    alias: {
      '#supabase/server': path.resolve(__dirname, 'tests/mocks/supabase-server.ts'),
      '~': path.resolve(__dirname),
      '@': path.resolve(__dirname),
    },
  },
});