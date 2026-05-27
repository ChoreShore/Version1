describe('Dashboard Layout & Conditional Rendering (Mocked)', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('should render employer dashboard layout with correct headers, stats, and empty states', () => {
    // 1. Log in as an employer
    cy.mockLogin({
      roles: ['employer'],
      activeRole: 'employer',
      firstName: 'Boss',
      lastName: 'User'
    })

    // 2. Mock empty responses for jobs, applications, and payments
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

  it('should render worker dashboard layout with correct headers, stats, and empty states', () => {
    // 1. Log in as a worker with verified RTW to avoid the blocking RTW modal
    cy.mockLogin({
      roles: ['worker'],
      activeRole: 'worker',
      firstName: 'Hard',
      lastName: 'Worker',
      rtwStatus: 'verified'
    })

    // 2. Mock empty responses for jobs, applications, and payments
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

    // 4. Verify worker-specific headers
    cy.contains('Available Jobs').should('be.visible')
    cy.contains('Latest job opportunities').should('be.visible')

    // 5. Verify worker-specific stats cards
    cy.contains('Applications sent').should('be.visible')
    cy.contains('Avg. rating').should('be.visible')

    // 6. Verify worker empty states
    cy.contains('No jobs available').should('be.visible')
    cy.contains('No applications sent').should('be.visible')
    cy.contains('Find jobs').should('be.visible')
  })
})
