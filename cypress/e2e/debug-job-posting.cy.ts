describe('Debug Job Posting', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.signIn(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
  })

  it('should debug job creation step by step', () => {
    // Navigate to job creation page
    cy.visit('/jobs/new', { failOnStatusCode: false })
    cy.url().then(url => {
      console.log('Job creation page URL:', url)
    })

    // Check if page loads
    cy.get('body').should('exist')
    cy.get('body').invoke('text').then(text => {
      console.log('Page content preview:', text.substring(0, 200))
    })

    // Look for job creation form
    const formSelectors = [
      'input[id="title"]',
      'input[name="title"]',
      'input[placeholder*="title"]',
      'textarea[id="description"]',
      'textarea[name="description"]',
      'textarea[placeholder*="description"]',
      'select[id="category"]',
      'select[name="category"]',
      'select[id="budget_type"]',
      'select[name="budget_type"]',
      'input[id="budget_amount"]',
      'input[name="budget_amount"]',
      'input[id="deadline"]',
      'input[name="deadline"]',
      'input[id="postcode"]',
      'input[name="postcode"]',
      'button[type="submit"]',
      'button:contains("Post")',
      'button:contains("Create")',
      'button:contains("Submit")'
    ]

    let foundElements = []
    formSelectors.forEach(selector => {
      cy.get('body').then($body => {
        if ($body.find(selector).length > 0) {
          foundElements.push(selector)
          console.log('Found element:', selector)
        }
      })
    })

    // Wait a bit to collect all findings
    cy.wait(1000).then(() => {
      console.log('Total form elements found:', foundElements.length)
      console.log('Elements:', foundElements)
    })

    // Check if there's any error message
    cy.get('body').invoke('text').then(text => {
      if (text.includes('error') || text.includes('Error') || text.includes('unauthorized')) {
        console.log('Found error in page:', text)
      }
    })
  })

  it('should check if job creation page exists', () => {
    // Try different possible job creation URLs
    const possibleUrls = ['/jobs/new', '/jobs/create', '/post-job', '/employer/post-job']
    
    possibleUrls.forEach(url => {
      cy.visit(url, { failOnStatusCode: false })
      cy.url().then(currentUrl => {
        console.log(`Visited ${url}, ended up at: ${currentUrl}`)
      })
      
      cy.get('body').invoke('text').then(text => {
        if (text.includes('job') || text.includes('Job') || text.includes('post') || text.includes('Post')) {
          console.log(`Found job-related content at ${url}`)
        }
      })
    })
  })

  it('should check dashboard for job posting options', () => {
    cy.visit('/dashboard')
    
    // Look for job posting links or buttons
    const jobPostingSelectors = [
      'a:contains("Post Job")',
      'a:contains("Create Job")',
      'a:contains("New Job")',
      'a:contains("Add Job")',
      'button:contains("Post Job")',
      'button:contains("Create Job")',
      'a[href*="/jobs/new"]',
      'a[href*="/job"]',
      '[data-testid="post-job"]',
      '.post-job',
      '.create-job'
    ]

    jobPostingSelectors.forEach(selector => {
      cy.get('body').then($body => {
        if ($body.find(selector).length > 0) {
          console.log('Found job posting element:', selector)
        }
      })
    })
  })

  it('should check employer permissions', () => {
    cy.visit('/dashboard')
    
    // Check if user has employer role/permissions
    cy.get('body').invoke('text').then(text => {
      console.log('Dashboard content:', text.substring(0, 300))
      
      // Look for employer-specific content
      const employerKeywords = ['employer', 'Employer', 'post job', 'Post Job', 'manage jobs', 'Manage Jobs', 'applications', 'Applications']
      const foundKeywords = employerKeywords.filter(keyword => text.includes(keyword))
      
      console.log('Employer-related keywords found:', foundKeywords)
      
      if (foundKeywords.length === 0) {
        console.log('No employer-specific content found - might be worker account or permissions issue')
      }
    })
  })
})
