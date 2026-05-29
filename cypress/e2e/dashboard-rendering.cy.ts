describe('Employer Dashboard Layout & Conditional Rendering', () => {
  beforeEach(() => {
    // Use cached session — cy.signIn() only runs once, subsequent tests restore cookies
    cy.session('employer', () => {
      cy.signIn()
    })
  })

  it('should render employer dashboard layout with correct headers, stats, and empty states', () => {
    // Mock empty responses for jobs, applications, and payments
    cy.intercept('GET', '/api/jobs*', {
      statusCode: 200,
      body: { jobs: [] }
    }).as('getJobs')

    cy.intercept('GET', '/api/applications*', {
      statusCode: 200,
      body: { applications: [] }
    }).as('getApplications')

    cy.intercept('GET', '/api/payments*', {
      statusCode: 200,
      body: { events: [] }
    }).as('getPayments')

    // 3. Visit dashboard and wait for API requests to complete
    cy.visit('/dashboard')
    cy.wait(['@getJobs', '@getApplications', '@getPayments'])

    // 4. Verify employer-specific headers
    cy.contains('Recent Jobs').should('be.visible')
    cy.contains('Latest jobs you posted').should('be.visible')

    // 5. Verify employer-specific stats cards
    cy.contains('Open jobs').should('be.visible')
    cy.contains('Pending decisions').should('be.visible')
    cy.contains('Pending payments').should('be.visible')

    // 6. Verify employer empty states
    cy.contains('No jobs posted yet').should('be.visible')
    cy.contains('No applications received').should('be.visible')
    cy.contains('Post your first job').should('be.visible')
  })

})
