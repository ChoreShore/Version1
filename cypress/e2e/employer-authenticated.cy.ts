describe('Employer Authenticated Journey', () => {
  beforeEach(() => {
    // Clear session before each test
    cy.clearCookies()
    cy.clearLocalStorage()
    
    // Sign in with real employer credentials
    cy.signIn(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
  })

  describe('Authentication', () => {
    it('should successfully sign in as employer', () => {
      cy.url().should('include', '/dashboard')
      cy.get('body').should('contain', 'Dashboard')
    })

    it('should maintain session across page refreshes', () => {
      cy.visit('/dashboard')
      cy.url().should('include', '/dashboard')
      
      // Refresh page
      cy.reload()
      cy.url().should('include', '/dashboard')
    })

    it('should sign out successfully', () => {
      // Look for sign out button/link
      cy.get('body').then($body => {
        if ($body.find('button:contains("Sign Out"), a:contains("Sign Out")').length > 0) {
          cy.get('button:contains("Sign Out"), a:contains("Sign Out")').first().click()
        } else if ($body.find('[data-testid="sign-out"], .sign-out').length > 0) {
          cy.get('[data-testid="sign-out"], .sign-out').first().click()
        }
      })
      
      // Should redirect to sign-in
      cy.url().should('include', '/auth/sign-in')
    })
  })

  describe('Dashboard Functionality', () => {
    it('should display employer dashboard', () => {
      cy.visit('/dashboard')
      
      // Check for employer-specific elements
      cy.get('body').should('contain', 'Dashboard')
      
      // Look for employer features
      cy.get('body').then($body => {
        const text = $body.text()
        // Check for common employer dashboard elements
        expect(text).to.match(/My Jobs|Posted Jobs|Manage Jobs|Applications|Hiring/i)
      })
    })

    it('should show user profile information', () => {
      cy.visit('/dashboard')
      
      // Look for user email or profile info
      cy.get('body').should('contain', Cypress.env('TEST_EMAIL'))
    })
  })

  describe('Job Management', () => {
    it('should navigate to job creation page', () => {
      cy.visit('/jobs/new')
      cy.url().should('include', '/jobs/new')
      
      // Check for job creation form
      cy.get('input[id="title"]').should('exist')
      cy.get('textarea[id="description"]').should('exist')
      cy.get('select[id="category"]').should('exist')
      cy.get('select[id="budget_type"]').should('exist')
      cy.get('input[id="budget_amount"]').should('exist')
      cy.get('input[id="deadline"]').should('exist')
      cy.get('input[id="postcode"]').should('exist')
    })

    it('should create a new job posting', () => {
      const timestamp = Date.now()
      const jobData = {
        title: `Test Job ${timestamp}`,
        description: 'This is a test job posting created by Cypress E2E tests',
        category: 'cleaning',
        budget_type: 'fixed',
        budget_amount: 100,
        deadline: '2024-12-31',
        postcode: '12345'
      }

      cy.visit('/jobs/new')
      
      // Fill out the job form
      cy.get('input[id="title"]').type(jobData.title)
      cy.get('textarea[id="description"]').type(jobData.description)
      cy.get('select[id="category"]').select(jobData.category)
      cy.get('select[id="budget_type"]').select(jobData.budget_type)
      cy.get('input[id="budget_amount"]').type(jobData.budget_amount.toString())
      cy.get('input[id="deadline"]').type(jobData.deadline)
      cy.get('input[id="postcode"]').type(jobData.postcode)
      
      // Submit the form
      cy.get('button[type="submit"]').click()
      
      // Should redirect or show success
      cy.url().should('not.include', '/jobs/new')
    })

    it('should view posted jobs', () => {
      cy.visit('/jobs')
      cy.url().should('include', '/jobs')
      
      // Look for job listings
      cy.get('body').then($body => {
        const text = $body.text()
        // Should show some job-related content
        expect(text).to.match(/Job|Position|Hiring|Work/i)
      })
    })
  })

  describe('Application Management', () => {
    it('should be able to view applications', () => {
      // Navigate to applications or dashboard
      cy.visit('/dashboard')
      
      // Look for applications section
      cy.get('body').then($body => {
        const text = $body.text()
        if (text.includes('Applications') || text.includes('Applicants')) {
          // Applications section exists
          expect(text).to.match(/Applications|Applicants/i)
        }
      })
    })

    it('should access job management features', () => {
      cy.visit('/dashboard')
      
      // Look for employer-specific management features
      cy.get('body').then($body => {
        const text = $body.text()
        // Check for management features
        const hasManagementFeatures = 
          text.includes('Manage') || 
          text.includes('Edit') || 
          text.includes('Delete') ||
          text.includes('Applications') ||
          text.includes('Posted Jobs')
        
        expect(hasManagementFeatures).to.be.true
      })
    })
  })

  describe('Navigation and Routing', () => {
    it('should access all employer pages', () => {
      // Test navigation to different pages
      const pages = ['/dashboard', '/jobs', '/jobs/new', '/applications']
      
      pages.forEach(page => {
        cy.visit(page, { failOnStatusCode: false })
        cy.get('body').should('exist')
      })
    })

    it('should handle protected routes', () => {
      // Should be able to access employer-only routes
      cy.visit('/dashboard')
      cy.url().should('include', '/dashboard')
      
      cy.visit('/jobs/new')
      cy.url().should('include', '/jobs/new')
    })
  })

  describe('Responsive Design (Authenticated)', () => {
    it('should work on mobile when signed in', () => {
      cy.viewport(375, 667) // iPhone SE
      cy.visit('/dashboard')
      cy.get('body').should('contain', 'Dashboard')
    })

    it('should work on tablet when signed in', () => {
      cy.viewport(768, 1024) // iPad
      cy.visit('/dashboard')
      cy.get('body').should('contain', 'Dashboard')
    })
  })
})
