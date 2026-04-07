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
      USE_REAL_SUPABASE: true,
      USE_MOCKS: false,
      // Test account credentials — fill these in before running e2e
      TEST_EMAIL: 'developertestingemail6@gmail.com',
      TEST_PASSWORD: 'Ac89hgiy?',
      // Unverified worker account (rtw_status = 'unverified')
      // Falls back to TEST_EMAIL/TEST_PASSWORD if not set
      TEST_WORKER_UNVERIFIED_EMAIL: '',
      TEST_WORKER_UNVERIFIED_PASSWORD: '',
      // Verified worker account (rtw_status = 'verified', not expired)
      // Falls back to TEST_EMAIL/TEST_PASSWORD if not set
      TEST_WORKER_VERIFIED_EMAIL: '',
      TEST_WORKER_VERIFIED_PASSWORD: ''
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
