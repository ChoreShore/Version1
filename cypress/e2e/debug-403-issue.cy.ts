describe('Debug 403 Forbidden Issue', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.signIn(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
  })

  it('should debug the exact 403 error', () => {
    cy.visit('/jobs/new')
    
    // Fill the form completely
    cy.get('input[id="title"]').type('Debug Test Job')
    cy.get('textarea[id="description"]').type('Debug test description')
    cy.get('select[id="category"]').select('cleaning')
    cy.get('select[id="budget_type"]').select('fixed')
    cy.get('input[id="budget_amount"]').type('100')
    cy.get('input[id="deadline"]').type('2024-12-31')
    cy.get('input[id="postcode"]').type('12345')
    
    // Submit the form
    cy.get('button[type="submit"]').click()
    
    // Wait for response
    cy.wait(2000)
    
    // Check what happens
    cy.get('body').invoke('text').then(text => {
      console.log('=== 403 ERROR DEBUG ===')
      console.log('Page content after submission:', text)
      
      // Look for specific error messages
      if (text.includes('Only employers can create jobs')) {
        console.log('❌ PROFILE ISSUE: User profile not found or no employer role')
      } else if (text.includes('Validation failed')) {
        console.log('❌ VALIDATION ISSUE: Form validation failed')
      } else if (text.includes('Invalid category')) {
        console.log('❌ CATEGORY ISSUE: Invalid job category')
      } else if (text.includes('error') || text.includes('Error')) {
        console.log('❌ GENERAL ERROR: Some other error occurred')
        console.log('Error details:', text.match(/error[^.]*\./i))
      } else {
        console.log('❓ UNKNOWN: No clear error message found')
        console.log('Full text:', text)
      }
    })
    
    // Check URL after submission
    cy.url().then(url => {
      console.log('URL after job submission:', url)
    })
  })

  it('should check user profile data directly', () => {
    // Try to access user profile data
    cy.visit('/dashboard')
    
    cy.get('body').invoke('text').then(text => {
      console.log('=== USER PROFILE DEBUG ===')
      console.log('Dashboard content:', text)
      
      // Look for any user information
      if (text.includes(Cypress.env('TEST_EMAIL'))) {
        console.log('✅ User email found in dashboard')
      } else {
        console.log('❌ User email not found in dashboard')
      }
    })
  })

  it('should check if all required form fields exist', () => {
    cy.visit('/jobs/new')
    
    // Check each required field
    const requiredFields = [
      { selector: 'input[id="title"]', name: 'title' },
      { selector: 'textarea[id="description"]', name: 'description' },
      { selector: 'select[id="category"]', name: 'category' },
      { selector: 'select[id="budget_type"]', name: 'budget_type' },
      { selector: 'input[id="budget_amount"]', name: 'budget_amount' },
      { selector: 'input[id="deadline"]', name: 'deadline' },
      { selector: 'input[id="postcode"]', name: 'postcode' }
    ]
    
    requiredFields.forEach(field => {
      cy.get('body').then($body => {
        const exists = $body.find(field.selector).length > 0
        console.log(`Field ${field.name} exists:`, exists)
        
        if (!exists) {
          console.log(`❌ MISSING FIELD: ${field.name} (${field.selector})`)
        }
      })
    })
  })

  it('should check API request details', () => {
    // Intercept the API call to see exactly what's being sent
    cy.intercept('POST', '**/api/jobs').as('createJob')
    
    cy.visit('/jobs/new')
    
    // Fill form
    cy.get('input[id="title"]').type('API Test Job')
    cy.get('textarea[id="description"]').type('API test description')
    cy.get('select[id="category"]').select('cleaning')
    cy.get('select[id="budget_type"]').select('fixed')
    cy.get('input[id="budget_amount"]').type('100')
    cy.get('input[id="deadline"]').type('2024-12-31')
    cy.get('input[id="postcode"]').type('12345')
    
    // Submit
    cy.get('button[type="submit"]').click()
    
    // Check the intercepted request
    cy.wait('@createJob').then(interception => {
      console.log('=== API REQUEST DEBUG ===')
      console.log('Request URL:', interception.request.url)
      console.log('Request method:', interception.request.method)
      console.log('Request headers:', interception.request.headers)
      console.log('Request body:', interception.request.body)
      console.log('Response status:', interception.response?.statusCode)
      console.log('Response body:', interception.response?.body)
    })
  })
})
