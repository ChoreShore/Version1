// vitest.config.ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';
 
export default defineConfig({
  test: {
    setupFiles: ['tests/setup.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '#supabase/server': path.resolve(__dirname, 'tests/mocks/supabase-server.ts'),
      '~': path.resolve(__dirname),
      '@': path.resolve(__dirname),
    },
  },
});