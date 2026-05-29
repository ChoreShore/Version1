import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // Run `npm run dev` before tests, or use `npm run test:e2e:ci`
    baseUrl: 'http://localhost:3000',
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
      USE_REAL_SUPABASE: true,
      USE_MOCKS: false
      // Test credentials are read from OS env vars prefixed with CYPRESS_:
      //   CYPRESS_TEST_EMAIL, CYPRESS_TEST_PASSWORD
      //   CYPRESS_TEST_WORKER_UNVERIFIED_EMAIL, CYPRESS_TEST_WORKER_UNVERIFIED_PASSWORD
      //   CYPRESS_TEST_WORKER_VERIFIED_EMAIL, CYPRESS_TEST_WORKER_VERIFIED_PASSWORD
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
