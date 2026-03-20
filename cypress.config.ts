import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // Use your deployed website URL
    baseUrl: 'https://version1-seven.vercel.app', // Your deployed ChoreShore app
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      // Environment variables for testing
      USE_REAL_SUPABASE: true, // Use real Supabase for deployed app
      USE_MOCKS: false
    },
    // Retry configuration for flaky tests
    retries: {
      runMode: 2,
      openMode: 0
    }
  },
  // For component testing (if needed later)
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite'
    }
  }
})
