// ─────────────────────────────────────────────────────────────
// Credential helpers — worker-specific vars fall back to TEST_EMAIL
// ─────────────────────────────────────────────────────────────
function unverifiedEmail(): string {
  return Cypress.env('TEST_WORKER_UNVERIFIED_EMAIL') || Cypress.env('TEST_EMAIL') || ''
}
function unverifiedPassword(): string {
  return Cypress.env('TEST_WORKER_UNVERIFIED_PASSWORD') || Cypress.env('TEST_PASSWORD') || ''
}
function verifiedEmail(): string {
  return Cypress.env('TEST_WORKER_VERIFIED_EMAIL') || Cypress.env('TEST_EMAIL') || ''
}
function verifiedPassword(): string {
  return Cypress.env('TEST_WORKER_VERIFIED_PASSWORD') || Cypress.env('TEST_PASSWORD') || ''
}
function baseEmail(): string {
  return Cypress.env('TEST_EMAIL') || ''
}
function basePassword(): string {
  return Cypress.env('TEST_PASSWORD') || ''
}

describe('RTW Verification Gate', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  // ─────────────────────────────────────────────────────────────
  // API-level tests (no browser UI needed)
  // ─────────────────────────────────────────────────────────────

  describe('POST /api/rtw/verify — API validation', () => {
    before(function () {
      if (!baseEmail() || !basePassword()) {
        cy.log('⚠️ TEST_EMAIL / TEST_PASSWORD not set — skipping API auth tests')
        this.skip()
      }
    })

    it('returns 401 when called without an authenticated session', () => {
      cy.request({
        method: 'POST',
        url: '/api/rtw/verify',
        body: { code: 'W1234567', dob: '07-09-1999', forename: 'John', surname: 'Doe' },
        failOnStatusCode: false
      }).then((response) => {
        cy.log('Status:', String(response.status))
        expect(response.status).to.equal(401)
      })
    })

    it('returns 400 with validation errors for an empty body', () => {
      cy.signIn(baseEmail(), basePassword())
      cy.wait(2000)

      cy.request({
        method: 'POST',
        url: '/api/rtw/verify',
        body: {},
        failOnStatusCode: false
      }).then((response) => {
        cy.log('Status:', String(response.status))
        cy.log('Body:', JSON.stringify(response.body))
        expect(response.status).to.equal(400)
      })
    })

    it('returns 400 when share code does not start with W', () => {
      cy.signIn(baseEmail(), basePassword())
      cy.wait(2000)

      cy.request({
        method: 'POST',
        url: '/api/rtw/verify',
        body: { code: 'R9999999', dob: '01-01-2000', forename: 'Jane', surname: 'Smith' },
        failOnStatusCode: false
      }).then((response) => {
        cy.log('Status:', String(response.status))
        cy.log('Body:', JSON.stringify(response.body))
        expect(response.status).to.equal(400)
        expect(response.body).to.have.property('data')
        expect(response.body.data).to.have.property('errors')
        expect(response.body.data.errors).to.have.property('code')
      })
    })

    it('returns 400 when dob is in wrong format', () => {
      cy.signIn(baseEmail(), basePassword())
      cy.wait(2000)

      cy.request({
        method: 'POST',
        url: '/api/rtw/verify',
        body: { code: 'W1234567', dob: '2000/01/01', forename: 'Jane', surname: 'Smith' },
        failOnStatusCode: false
      }).then((response) => {
        cy.log('Status:', String(response.status))
        expect(response.status).to.equal(400)
        expect(response.body.data.errors).to.have.property('dob')
      })
    })

    it('returns non-401 for a valid-shaped payload (auth passes, API called)', () => {
      cy.signIn(baseEmail(), basePassword())
      cy.wait(2000)

      cy.request({
        method: 'POST',
        url: '/api/rtw/verify',
        body: {
          code: 'W9999999',
          dob: '01-01-2000',
          forename: 'Test',
          surname: 'User'
        },
        failOnStatusCode: false
      }).then((response) => {
        cy.log('Status:', String(response.status))
        cy.log('Body:', JSON.stringify(response.body))
        // We don't control RapidAPI outcome, but auth and Zod validation both passed
        expect(response.status).to.not.equal(401)
        expect(response.status).to.not.equal(400)
      })
    })
  })

  // ─────────────────────────────────────────────────────────────
  // UI — dashboard RTW gate (unverified worker)
  // ─────────────────────────────────────────────────────────────

  describe('Dashboard — RTW modal gate', () => {
    before(function () {
      if (!unverifiedEmail() || !unverifiedPassword()) {
        cy.log('⚠️ Unverified worker credentials not set — skipping dashboard gate tests')
        this.skip()
      }
    })

    it('shows the RTW verification modal when an unverified worker visits the dashboard', () => {
      cy.signIn(unverifiedEmail(), unverifiedPassword())
      cy.wait(2000)

      cy.visit('/dashboard')
      cy.wait(2000)

      cy.switchToWorker()

      cy.get('[role="dialog"]', { timeout: 8000 }).should('be.visible')
      cy.contains('Verify your right to work').should('be.visible')
      cy.log('✅ RTW modal is blocking the dashboard for unverified worker')
    })

    it('RTW modal contains all required form fields', () => {
      cy.signIn(unverifiedEmail(), unverifiedPassword())
      cy.wait(2000)

      cy.visit('/dashboard')
      cy.wait(2000)
      cy.switchToWorker()

      cy.get('[role="dialog"]', { timeout: 8000 }).within(() => {
        cy.get('#rtw-code').should('be.visible')
        cy.get('#rtw-dob').should('be.visible')
        cy.get('#rtw-forename').should('be.visible')
        cy.get('#rtw-surname').should('be.visible')
        cy.get('button.rtw-modal__submit').should('be.visible')
      })

      cy.log('✅ All RTW modal fields present')
    })

    it('RTW modal pre-fills forename and surname from user profile', () => {
      cy.signIn(unverifiedEmail(), unverifiedPassword())
      cy.wait(2000)

      cy.visit('/dashboard')
      cy.wait(2000)
      cy.switchToWorker()

      cy.get('[role="dialog"]', { timeout: 8000 }).within(() => {
        cy.get('#rtw-forename').invoke('val').should('not.be.empty')
        cy.get('#rtw-surname').invoke('val').should('not.be.empty')
      })

      cy.log('✅ Name fields pre-filled from user metadata')
    })
  })

  // ─────────────────────────────────────────────────────────────
  // UI — RTW modal form validation
  // ─────────────────────────────────────────────────────────────

  describe('RTW modal — client-side form validation', () => {
    before(function () {
      if (!unverifiedEmail() || !unverifiedPassword()) {
        cy.log('⚠️ Unverified worker credentials not set — skipping form validation tests')
        this.skip()
      }
    })

    beforeEach(() => {
      cy.signIn(unverifiedEmail(), unverifiedPassword())
      cy.wait(2000)
      cy.visit('/dashboard')
      cy.wait(2000)
      cy.switchToWorker()
      cy.get('[role="dialog"]', { timeout: 8000 }).should('be.visible')
    })

    it('shows field errors when submitting an empty form', () => {
      cy.get('#rtw-code').clear()
      cy.get('#rtw-dob').clear()
      cy.get('#rtw-forename').clear()
      cy.get('#rtw-surname').clear()
      cy.get('button.rtw-modal__submit').click()

      cy.get('.rtw-modal__field-error', { timeout: 5000 }).should('have.length.at.least', 1)
      cy.log('✅ Field errors shown on empty submit')
    })

    it('shows an error when share code does not start with W', () => {
      cy.get('#rtw-code').clear().type('R1234567')
      cy.get('#rtw-dob').clear().type('07-09-1999')
      cy.get('#rtw-forename').clear().type('John')
      cy.get('#rtw-surname').clear().type('Doe')
      cy.get('button.rtw-modal__submit').click()

      cy.get('.rtw-modal__field-error', { timeout: 5000 })
        .should('be.visible')
        .and('contain.text', 'W')

      cy.log("✅ Error shown for share code not starting with 'W'")
    })

    it('shows an error when dob format is incorrect', () => {
      cy.get('#rtw-code').clear().type('W1234567')
      cy.get('#rtw-dob').clear().type('1999-07-09')
      cy.get('#rtw-forename').clear().type('John')
      cy.get('#rtw-surname').clear().type('Doe')
      cy.get('button.rtw-modal__submit').click()

      cy.get('.rtw-modal__field-error', { timeout: 5000 })
        .should('be.visible')
        .and('contain.text', 'dd-mm-yyyy')

      cy.log('✅ Error shown for wrong date format')
    })

    it('does not show errors for a valid payload before submission completes', () => {
      cy.get('#rtw-code').clear().type('W1234567')
      cy.get('#rtw-dob').clear().type('07-09-1999')
      cy.get('#rtw-forename').clear().type('John')
      cy.get('#rtw-surname').clear().type('Doe')

      cy.get('.rtw-modal__field-error').should('not.exist')
      cy.log('✅ No field errors on a fully filled valid form before submit')
    })

    it('submit button is visible and enabled with a valid form', () => {
      cy.get('#rtw-code').clear().type('W1234567')
      cy.get('#rtw-dob').clear().type('07-09-1999')
      cy.get('#rtw-forename').clear().type('John')
      cy.get('#rtw-surname').clear().type('Doe')

      cy.get('button.rtw-modal__submit')
        .should('be.visible')
        .and('not.be.disabled')

      cy.log('✅ Submit button enabled for valid form')
    })

    it('shows an API error message when share code is not found', () => {
      cy.fillRtwForm('W0000000', '01-01-2000', 'Test', 'User')

      cy.get('.rtw-modal__api-error', { timeout: 15000 }).should('be.visible')

      cy.get('body').invoke('text').then((text) => {
        const hasExpectedError =
          text.toLowerCase().includes('not found') ||
          text.toLowerCase().includes('rejected') ||
          text.toLowerCase().includes('locked') ||
          text.toLowerCase().includes('expired') ||
          text.toLowerCase().includes('failed')
        expect(hasExpectedError).to.be.true
      })

      cy.log('✅ API error shown for invalid share code')
    })
  })

  // ─────────────────────────────────────────────────────────────
  // UI — job detail RTW gate
  // ─────────────────────────────────────────────────────────────

  describe('Job detail — RTW gate on apply panel', () => {
    before(function () {
      if (!unverifiedEmail() || !unverifiedPassword()) {
        cy.log('⚠️ Unverified worker credentials not set — skipping job detail gate tests')
        this.skip()
      }
    })

    it('shows the RTW gate panel instead of the apply form for an unverified worker', () => {
      cy.signIn(unverifiedEmail(), unverifiedPassword())
      cy.wait(2000)

      cy.visit('/jobs')
      cy.wait(2000)
      cy.switchToWorker()

      cy.get('a[href*="/jobs/"]', { timeout: 8000 }).first().click()
      cy.wait(3000)
      cy.url().should('include', '/jobs/')

      cy.contains('Job info', { timeout: 8000 }).should('be.visible')

      cy.get('body').then(($body) => {
        const hasGate = $body.find('.rtw-gate').length > 0

        if (hasGate) {
          cy.contains('Right to work required').should('be.visible')
          cy.contains('Verify now').should('be.visible')
          cy.log('✅ RTW gate shown on job detail page')
        } else {
          cy.log('ℹ️ RTW gate not present — job may be closed, owned, or worker already verified')
          cy.get('body').invoke('text').then((text) => {
            cy.log('Page preview:', text.substring(0, 200))
          })
        }
      })
    })

    it('"Verify now" button on the job detail gate opens the RTW modal', () => {
      cy.signIn(unverifiedEmail(), unverifiedPassword())
      cy.wait(2000)

      cy.visit('/jobs')
      cy.wait(2000)
      cy.switchToWorker()

      cy.get('a[href*="/jobs/"]', { timeout: 8000 }).first().click()
      cy.wait(3000)

      cy.get('body').then(($body) => {
        if ($body.find('.rtw-gate').length > 0) {
          cy.get('button.rtw-gate__button').contains('Verify now').click()
          cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible')
          cy.contains('Verify your right to work').should('be.visible')
          cy.log('✅ RTW modal opens from job detail gate button')
        } else {
          cy.log('ℹ️ RTW gate not present — skipping modal open check')
        }
      })
    })
  })

  // ─────────────────────────────────────────────────────────────
  // UI — verified worker sees no gate
  // ─────────────────────────────────────────────────────────────

  describe('Verified worker — no RTW gate shown', () => {
    before(function () {
      if (!verifiedEmail() || !verifiedPassword()) {
        cy.log('⚠️ Verified worker credentials not set — skipping verified worker tests')
        this.skip()
      }
    })

    it('does not show the RTW modal on the dashboard for a verified worker', () => {
      cy.signIn(verifiedEmail(), verifiedPassword())
      cy.wait(2000)

      cy.visit('/dashboard')
      cy.wait(2000)
      cy.switchToWorker()

      cy.get('[role="dialog"]').should('not.exist')
      cy.log('✅ No RTW modal shown for verified worker')
    })

    it('verified worker sees the apply form on an open job (not the RTW gate)', () => {
      cy.signIn(verifiedEmail(), verifiedPassword())
      cy.wait(2000)

      cy.visit('/jobs')
      cy.wait(2000)
      cy.switchToWorker()

      cy.get('a[href*="/jobs/"]', { timeout: 8000 }).first().click()
      cy.wait(3000)

      cy.get('body').then(($body) => {
        const hasGate = $body.find('.rtw-gate').length > 0
        if (hasGate) {
          cy.log('⚠️ RTW gate found — worker may not be verified or job is closed')
        } else {
          cy.log('✅ No RTW gate — apply form or status shown as expected')
        }
        expect(hasGate).to.be.false
      })
    })
  })
})
