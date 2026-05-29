describe('Auth Flows', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Sign-In', () => {
    it('signs in with valid credentials and redirects to dashboard', () => {
      cy.signIn()
      cy.url({ timeout: 10000 }).should('match', /\/(dashboard|auth\/complete-profile)/)
    })

    it('shows an error with invalid credentials', () => {
      cy.visit('/auth/sign-in')
      cy.wait(500)
      cy.get('input[id="email"]').should('be.visible').clear().type('nonexistent@example.com', { delay: 0 })
      cy.get('input[id="password"]').clear().type('WrongPass123!', { delay: 0 })
      cy.get('button[type="submit"]').should('not.be.disabled').click()

      cy.get('.auth-card__error, [role="alert"]', { timeout: 10000 })
        .should('be.visible')
    })
  })

  describe('Password Reset', () => {
    beforeEach(() => {
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 200,
        body: { success: true }
      }).as('resetPassword')
      cy.visit('/auth/reset-password')
    })

    it('sends a reset link for a valid email', () => {
      cy.get('input[id="email"]').should('be.visible').clear().type('costanza@bromleywebworks.co.uk', { delay: 0 })
      cy.get('button[type="submit"]').should('not.be.disabled').click()

      cy.contains('Reset link sent', { timeout: 10000 }).should('be.visible')
    })

    it('shows validation error for empty email', () => {
      cy.get('form').submit()
      cy.get('.form-field__error').should('exist')
    })
  })

  describe('Logout', () => {
    beforeEach(() => {
      // cy.signIn() goes through Supabase directly — no server rate limits
      // cy.session() caches the result so it only logs in once per run
      cy.session('employer', () => {
        cy.signIn()
      })
      cy.intercept('POST', '/api/auth/signout', {
        statusCode: 200,
        body: { success: true }
      }).as('signout')
    })

    it('signs out and redirects to sign-in', () => {
      cy.visit('/dashboard')
      cy.wait(2000)

      cy.get('.sidebar-footer__signout').click()
      cy.url({ timeout: 10000 }).should('include', '/auth/sign-in')
    })
  })
})
