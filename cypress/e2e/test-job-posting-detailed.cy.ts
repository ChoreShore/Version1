describe('Detailed Job Posting Test', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.signIn(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
  })

  it('should attempt to create a job and identify issues', () => {
    // Navigate to job creation
    cy.visit('/jobs/new')
    cy.url().should('include', '/jobs/new')
    
    // Check if form exists
    cy.get('body').then($body => {
      const hasTitleInput = $body.find('input[id="title"], input[name="title"]').length > 0
      const hasDescription = $body.find('textarea[id="description"], textarea[name="description"]').length > 0
      const hasSubmitButton = $body.find('button[type="submit"], button:contains("Post"), button:contains("Create")').length > 0
      
      console.log('Has title input:', hasTitleInput)
      console.log('Has description:', hasDescription)
      console.log('Has submit button:', hasSubmitButton)
      
      if (!hasTitleInput || !hasDescription || !hasSubmitButton) {
        console.log('Form elements missing - checking page content...')
        console.log('Page content:', $body.text().substring(0, 500))
      }
    })

    // Try to fill the form if elements exist
    cy.get('input[id="title"], input[name="title"]').then($title => {
      if ($title.length > 0) {
        const timestamp = Date.now()
        cy.wrap($title).type(`Test Job ${timestamp}`)
        
        cy.get('textarea[id="description"], textarea[name="description"]').type('This is a test job description')
        cy.get('select[id="category"], select[name="category"]').select('cleaning')
        cy.get('select[id="budget_type"], select[name="budget_type"]').select('fixed')
        cy.get('input[id="budget_amount"], input[name="budget_amount"]').type('100')
        cy.get('input[id="deadline"], input[name="deadline"]').type('2024-12-31')
        cy.get('input[id="postcode"], input[name="postcode"]').type('12345')
        
        // Try to submit
        cy.get('button[type="submit"], button:contains("Post"), button:contains("Create")').click()
        
        // Check what happens after submission
        cy.wait(2000)
        cy.url().then(url => {
          console.log('URL after submission:', url)
        })
        
        cy.get('body').invoke('text').then(text => {
          console.log('Page content after submission:', text.substring(0, 300))
          
          // Look for success or error messages
          if (text.includes('success') || text.includes('Success') || text.includes('created')) {
            console.log('✅ Job creation appears successful')
          } else if (text.includes('error') || text.includes('Error') || text.includes('failed')) {
            console.log('❌ Job creation failed - error present')
          } else {
            console.log('⚠️ Unclear result from job creation')
          }
        })
      } else {
        console.log('❌ Cannot find job title input - form may not be loaded')
        
        // Check for error messages or missing permissions
        cy.get('body').invoke('text').then(text => {
          if (text.includes('unauthorized') || text.includes('permission') || text.includes('access denied')) {
            console.log('❌ Permission issue detected')
          }
          if (text.includes('error') || text.includes('Error')) {
            console.log('❌ Error message found:', text.match(/error[^.]*\./i)?.[0])
          }
        })
      }
    })
  })

  it('should check if user actually has employer role', () => {
    // Check user profile or dashboard for role indicators
    cy.visit('/dashboard')
    
    cy.get('body').invoke('text').then(text => {
      console.log('Dashboard full content:', text)
      
      // Look for role indicators
      const roleIndicators = [
        'employer', 'Employer', 'worker', 'Worker', 
        'client', 'Client', 'freelancer', 'Freelancer'
      ]
      
      const foundRoles = roleIndicators.filter(role => text.includes(role))
      console.log('Role indicators found:', foundRoles)
      
      if (foundRoles.includes('worker') || foundRoles.includes('Worker') || foundRoles.includes('freelancer')) {
        console.log('⚠️ User appears to be a worker, not employer - this explains job posting issues')
      }
      
      if (foundRoles.includes('employer') || foundRoles.includes('Employer') || foundRoles.includes('client')) {
        console.log('✅ User appears to have employer role')
      }
    })
  })

  it('should check available navigation options', () => {
    cy.visit('/dashboard')
    
    // Look for all navigation links
    cy.get('a').each($link => {
      const href = $link.attr('href')
      const text = $link.text().trim()
      
      if (href && (href.includes('job') || href.includes('post') || href.includes('create'))) {
        console.log('Found job-related navigation:', text, '->', href)
      }
    })
    
    // Look for buttons that might lead to job creation
    cy.get('button').each($button => {
      const text = $button.text().trim()
      
      if (text.includes('Job') || text.includes('Post') || text.includes('Create')) {
        console.log('Found job-related button:', text)
      }
    })
  })
})
