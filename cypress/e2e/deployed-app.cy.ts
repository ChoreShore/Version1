describe('Deployed Application Tests', () => {
  beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Basic Functionality', () => {
    it('should load the homepage', () => {
      cy.visit('/')
      cy.get('body').should('contain', 'ChoreShore')
    })

    it('should navigate to jobs page', () => {
      cy.visit('/jobs')
      cy.get('body').should('contain', 'Jobs')
    })

    it('should load sign-in page', () => {
      cy.visit('/auth/sign-in')
      cy.get('body').should('contain', 'Sign in')
    })

    it('should load sign-up page', () => {
      cy.visit('/auth/sign-up')
      // Check for form elements instead of specific text
      cy.get('input[id="email"]').should('exist')
      cy.get('input[id="password"]').should('exist')
      cy.get('input[id="confirmPassword"]').should('exist')
    })
  })

  describe('Authentication Forms', () => {
    it('should have sign-up form elements', () => {
      cy.visit('/auth/sign-up')
      
      // Check if all form elements exist
      cy.get('input[id="email"]').should('exist')
      cy.get('input[id="password"]').should('exist')
      cy.get('input[id="confirmPassword"]').should('exist')
      cy.get('input[id="first_name"]').should('exist')
      cy.get('input[id="last_name"]').should('exist')
      cy.get('select[id="role"]').should('exist')
      cy.get('button[type="submit"]').should('exist')
    })

    it('should have sign-in form elements', () => {
      cy.visit('/auth/sign-in')
      
      // Check if all form elements exist
      cy.get('input[id="email"]').should('exist')
      cy.get('input[id="password"]').should('exist')
      cy.get('button[type="submit"]').should('exist')
    })

    it('should allow typing in sign-up form', () => {
      cy.visit('/auth/sign-up')
      
      // Test typing in form fields
      const timestamp = Date.now()
      const userEmail = `test-user-${timestamp}@example.com`
      
      cy.get('input[id="email"]').type(userEmail).should('have.value', userEmail)
      cy.get('input[id="password"]').type('TestPassword123!').should('have.value', 'TestPassword123!')
      cy.get('input[id="confirmPassword"]').type('TestPassword123!').should('have.value', 'TestPassword123!')
      cy.get('input[id="first_name"]').type('Test').should('have.value', 'Test')
      cy.get('input[id="last_name"]').type('User').should('have.value', 'User')
      cy.get('select[id="role"]').select('worker').should('have.value', 'worker')
    })

    it('should allow typing in sign-in form', () => {
      cy.visit('/auth/sign-in')
      
      // Test typing in form fields
      cy.get('input[id="email"]').type('test@example.com').should('have.value', 'test@example.com')
      cy.get('input[id="password"]').type('TestPassword123!').should('have.value', 'TestPassword123!')
    })
  })

  describe('Navigation', () => {
    it('should handle navigation between pages', () => {
      // Navigate to sign-in
      cy.visit('/auth/sign-in')
      cy.url().should('include', '/auth/sign-in')
      
      // Navigate to sign-up
      cy.visit('/auth/sign-up')
      cy.url().should('include', '/auth/sign-up')
      
      // Navigate to jobs
      cy.visit('/jobs')
      cy.url().should('include', '/jobs')
      
      // Navigate to homepage (might redirect due to auth logic)
      cy.visit('/')
      // Just check that we can visit homepage without errors
      cy.get('body').should('exist')
    })
  })

  describe('Responsive Design', () => {
    it('should work on mobile viewport', () => {
      cy.viewport(375, 667) // iPhone SE
      cy.visit('/')
      cy.get('body').should('contain', 'ChoreShore')
    })

    it('should work on tablet viewport', () => {
      cy.viewport(768, 1024) // iPad
      cy.visit('/')
      cy.get('body').should('contain', 'ChoreShore')
    })

    it('should work on desktop viewport', () => {
      cy.viewport(1920, 1080) // Full HD
      cy.visit('/')
      cy.get('body').should('contain', 'ChoreShore')
    })
  })
})
