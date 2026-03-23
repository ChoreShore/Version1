describe('Test Real Application Submission', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.signIn(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
  })

  it('should apply to an existing job as worker', () => {
    // Step 1: Switch to worker role
    cy.get('.role-switcher').should('exist')
    cy.get('.role-switcher__option').contains('Worker').click()
    cy.wait(2000)
    
    // Verify we're in worker role
    cy.get('.role-switcher__option.is-active').should('contain', 'Worker')
    
    // Step 2: Navigate to jobs page
    cy.visit('/jobs')
    cy.wait(2000)
    
    // Step 3: Click on the first job title
    cy.get('.job-card').first().find('a').first().click()
    cy.wait(3000)
    
    // Debug: Check what's on the job detail page
    cy.get('body').invoke('text').then(text => {
      cy.log('Job detail page content:', text.substring(0, 300))
    })
    
    // Step 4: Look for application form OR handle the case where it doesn't exist
    cy.get('.application-form', { timeout: 10000 }).should('exist').then(() => {
      // If application form exists, fill it out
      cy.contains('Ready to help?').should('be.visible')
      
      const coverLetter = `Automated test application submitted at ${new Date().toISOString()}`
      cy.get('textarea[placeholder="Share why you\'re a great fit"]').clear().type(coverLetter)
      cy.get('input[placeholder="e.g. 120"]').clear().type('75')
      cy.get('.application-form__button').click()
      
      // Step 5: Confirm submission result
      cy.contains(/application submitted/i).should('exist')
    }).catch(() => {
      // If application form doesn't exist, check if user already applied
      cy.get('.application-form__status').should('exist')
      cy.contains('You already applied').should('be.visible')
      cy.log('User already applied to this job')
    })
  })
})
