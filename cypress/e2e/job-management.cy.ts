describe('Job Management (Employer)', () => {
  const mockCategoryId = 'mock-cat-1'
  let testUserId = ''
  let mockJobs: any[] = []

  before(() => {
    // Establish and cache a real session so SSR auth succeeds
    cy.session('employer', () => {
      cy.signIn()
    })

    // Fetch the real user ID so mock jobs can have a matching employer_id
    cy.request({
      url: '/api/auth/me',
      headers: { Origin: Cypress.config('baseUrl') as string }
    }).then((res) => {
      testUserId = res.body.user.id
    })
  })

  beforeEach(() => {
    // Restore cached session for each test
    cy.session('employer', () => {
      cy.signIn()
    })

    // Reset in-memory mock state
    mockJobs = []

    // Categories
    cy.intercept({ method: 'GET', pathname: '/api/jobs/categories' }, {
      statusCode: 200,
      body: {
        categories: [
          { id: mockCategoryId, name: 'Cleaning', description: 'Cleaning services', created_at: new Date().toISOString(), is_active: true }
        ]
      }
    }).as('getCategories')

    // Job list
    cy.intercept({ method: 'GET', pathname: '/api/jobs' }, (req) => {
      req.reply({
        statusCode: 200,
        body: { jobs: mockJobs, preview_mode: false }
      })
    }).as('getJobs')

    // Job creation
    cy.intercept({ method: 'POST', pathname: '/api/jobs' }, (req) => {
      const job = {
        id: `mock-job-${Date.now()}`,
        employer_id: testUserId,
        title: req.body.title,
        description: req.body.description,
        category_id: req.body.category_id,
        postcode: req.body.postcode,
        latitude: null,
        longitude: null,
        budget_type: req.body.budget_type,
        budget_amount: req.body.budget_amount,
        deadline: req.body.deadline,
        estimated_hours: req.body.estimated_hours ?? null,
        is_recurring: req.body.is_recurring ?? false,
        is_urgent: false,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category_name: 'Cleaning',
        employer_first_name: 'Test',
        employer_last_name: 'User',
        category: { name: 'Cleaning' },
        employer: { first_name: 'Test', last_name: 'User' },
        application_count: 0
      }
      mockJobs.push(job)
      req.reply({ statusCode: 200, body: { job } })
    }).as('createJob')

    // Job detail
    cy.intercept({ method: 'GET', pathname: /^\/api\/jobs\/[^/]+$/ }, (req) => {
      const match = req.url.match(/\/api\/jobs\/([^?]+)/)
      const jobId = match ? match[1] : ''
      const job = mockJobs.find((j) => j.id === jobId)
      if (job) {
        req.reply({ statusCode: 200, body: { job } })
      } else {
        req.reply({ statusCode: 404, body: { statusMessage: 'Job not found' } })
      }
    }).as('getJob')

    // Job update
    cy.intercept({ method: 'PATCH', pathname: /^\/api\/jobs\/[^/]+$/ }, (req) => {
      const match = req.url.match(/\/api\/jobs\/([^?]+)/)
      const jobId = match ? match[1] : ''
      const jobIndex = mockJobs.findIndex((j) => j.id === jobId)
      if (jobIndex >= 0) {
        mockJobs[jobIndex] = { ...mockJobs[jobIndex], ...req.body, updated_at: new Date().toISOString() }
        req.reply({ statusCode: 200, body: { job: mockJobs[jobIndex] } })
      } else {
        req.reply({ statusCode: 404, body: { statusMessage: 'Job not found' } })
      }
    }).as('updateJob')

    // Job delete
    cy.intercept({ method: 'DELETE', pathname: /^\/api\/jobs\/[^/]+$/ }, (req) => {
      const match = req.url.match(/\/api\/jobs\/([^?]+)/)
      const jobId = match ? match[1] : ''
      mockJobs = mockJobs.filter((j) => j.id !== jobId)
      req.reply({ statusCode: 200, body: { success: true } })
    }).as('deleteJob')

    // Job applications
    cy.intercept({ method: 'GET', pathname: /^\/api\/applications\/job\/[^/]+$/ }, (req) => {
      req.reply({ statusCode: 200, body: { applications: [] } })
    }).as('getApplications')
  })

  describe('Create Job', () => {
    it('creates a job through the multi-step wizard', () => {
      const title = `Cypress Test Job ${Date.now()}`
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      cy.visit('/jobs/new')
      cy.wait(500)

      // Step 0: Basic Info
      cy.get('input[id="title"]').should('be.visible').clear().type(title, { delay: 0 })
      cy.get('select[id="category"]').select(mockCategoryId)
      cy.get('.job-form__submit').should('not.be.disabled').click()

      // Step 1: Description
      cy.get('textarea[id="description"]').clear().type('This is a detailed test job description created by Cypress automation.', { delay: 0 })
      cy.get('.job-form__submit').should('not.be.disabled').click()

      // Step 2: Budget & Timeline
      cy.get('select[id="budget_type"]').select('fixed')
      cy.get('input[id="budget_amount"]').clear().type('150', { delay: 0 })
      cy.get('input[id="deadline"]').clear().type(deadline, { delay: 0 })
      cy.get('.job-form__submit').should('not.be.disabled').click()

      // Step 3: Location
      cy.get('input[id="postcode"]').clear().type('BR1 2JT', { delay: 0 })
      cy.get('.job-form__submit').should('not.be.disabled').click()

      // Step 4: Review & Submit
      cy.contains(title).should('be.visible')
      cy.get('.job-form__submit').contains('Post a job').click()

      // Assert redirect to jobs list
      cy.url({ timeout: 10000 }).should('include', '/jobs')
      cy.contains(title, { timeout: 10000 }).should('be.visible')
    })

    it('shows validation errors when required fields are empty', () => {
      cy.visit('/jobs/new')

      cy.get('.job-form__submit').contains('Next').click({ force: true })

      // Validation errors should appear
      cy.get('.form-field__error').should('exist')
    })
  })

  describe('Job List', () => {
    it('renders the employer job list page', () => {
      cy.visit('/jobs')
      cy.wait(2000)

      cy.contains('Manage work').should('be.visible')
      cy.contains('Jobs').should('be.visible')
      cy.contains('Post a job').should('be.visible')
    })
  })

  describe('Job Detail', () => {
    beforeEach(() => {
      // Seed a mock job for detail tests
      const jobId = `detail-test-job-${Date.now()}`
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      mockJobs.push({
        id: jobId,
        employer_id: testUserId,
        title: `Detail Test ${Date.now()}`,
        description: 'Test job for detail page viewing.',
        category_id: mockCategoryId,
        postcode: 'BR1 2JT',
        latitude: null,
        longitude: null,
        budget_type: 'fixed',
        budget_amount: 200,
        deadline,
        estimated_hours: null,
        is_recurring: false,
        is_urgent: false,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category_name: 'Cleaning',
        employer_first_name: 'Test',
        employer_last_name: 'User',
        category: { name: 'Cleaning' },
        employer: { first_name: 'Test', last_name: 'User' },
        application_count: 0
      })

      cy.wrap(jobId).as('jobId')
    })

    it('displays job details for the employer owner', function () {
      cy.visit(`/jobs/${this.jobId}`)
      cy.wait(3000)

      // Job title and description should be visible
      cy.get('.job-detail__title').should('be.visible')
      cy.get('.job-detail__description').should('be.visible')

      // Employer controls should be visible
      cy.get('.job-detail__status-control').should('be.visible')
      cy.get('.job-detail__delete-button').should('be.visible')

      // Applications section
      cy.contains('Applications').should('be.visible')
    })

    it('allows the employer to change job status', function () {
      cy.visit(`/jobs/${this.jobId}`)
      cy.wait(3000)

      cy.get('.job-detail__status-select').select('closed')
      cy.wait(2000)

      cy.get('.job-detail__status-select').should('have.value', 'closed')
    })

    it('allows the employer to delete their job', function () {
      cy.visit(`/jobs/${this.jobId}`)
      cy.wait(3000)

      // Click delete button
      cy.get('.job-detail__delete-button').click()

      // Confirm in the dialog
      cy.contains('Delete Job').should('be.visible')
      cy.contains('button', 'Delete').click()

      // Should redirect to jobs list
      cy.url({ timeout: 10000 }).should('include', '/jobs')

      // Job should no longer appear
      cy.visit(`/jobs/${this.jobId}`)
      cy.wait(2000)
      cy.contains('Job unavailable').should('be.visible')
    })
  })
})
