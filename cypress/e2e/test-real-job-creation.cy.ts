describe('Test Real Job Creation', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.signIn()
  })

  it('should actually create a job and verify success', () => {
    cy.visit('/jobs/new')
    
    // Wait for page to load
    cy.get('input[id="title"]').should('exist')
    
    // Fill the form completely
    const timestamp = Date.now()
    cy.get('input[id="title"]').type(`Test Job ${timestamp}`)
    cy.get('textarea[id="description"]').type('Test job description created at ' + new Date().toISOString())
    cy.get('select[id="category"]').select('cleaning') // Try cleaning first
    cy.get('select[id="budget_type"]').select('fixed')
    cy.get('input[id="budget_amount"]').type('100')
    cy.get('input[id="deadline"]').type('2024-12-31')
    cy.get('input[id="postcode"]').type('12345')
    
    // Submit the form
    cy.get('button[type="submit"]').click()
    
    // Wait for response
    cy.wait(3000)
    
    // Check what happens after submission
    cy.get('body').invoke('text').then(text => {
      console.log('=== JOB CREATION RESULT ===')
      console.log('Page content after submission:', text.substring(0, 500))
      
      if (text.includes('Only employers can create jobs')) {
        console.log('❌ 403 ERROR: Profile role issue')
      } else if (text.includes('Profile not found')) {
        console.log('❌ 403 ERROR: Profile missing')
      } else if (text.includes('Validation failed')) {
        console.log('❌ 400 ERROR: Form validation failed')
      } else if (text.includes('Invalid category')) {
        console.log('❌ 400 ERROR: Invalid category')
      } else if (text.includes('error') || text.includes('Error')) {
        console.log('❌ API ERROR: ', text.match(/error[^.]*\./i))
      } else {
        console.log('✅ SUCCESS: No error messages found!')
      }
    })
    
    // Check final URL
    cy.url().then(url => {
      console.log('Final URL after submission:', url)
      
      if (url.includes('/dashboard')) {
        console.log('✅ SUCCESS: Redirected to dashboard')
      } else if (url.includes('/jobs/new')) {
        console.log('❌ FAILED: Still on job creation page')
      } else {
        console.log('❓ UNKNOWN: Unexpected URL')
      }
    })
    
    // Check if job was created by visiting jobs page
    cy.visit('/jobs')
    cy.get('body').invoke('text').then(text => {
      console.log('=== JOBS PAGE AFTER CREATION ===')
      console.log('Jobs page content:', text.substring(0, 300))
      
      if (text.includes(`Test Job ${timestamp}`)) {
        console.log('✅ SUCCESS: Job found on jobs page!')
      } else {
        console.log('❌ FAILED: Job not found on jobs page')
      }
    })
  })

  it('should check if user actually has employer role in database', () => {
    // This test checks the actual database state
    cy.request({
      method: 'POST',
      url: '/api/jobs',
      body: {
        title: 'Debug Test Job',
        description: 'Debug test description',
        category_id: '550e8400-e29b-41d4-a716-446655440000', // Use a valid UUID
        budget_type: 'fixed',
        budget_amount: 100,
        deadline: '2024-12-31',
        postcode: '12345'
      },
      failOnStatusCode: false
    }).then(response => {
      console.log('=== DIRECT API TEST ===')
      console.log('Response status:', response.status)
      console.log('Response body:', response.body)
      
      if (response.status === 403) {
        console.log('❌ 403 ERROR: Role issue confirmed')
      } else if (response.status === 200) {
        console.log('✅ SUCCESS: Job created via API')
      } else {
        console.log('❓ UNKNOWN: Unexpected status code')
      }
    })
  })
})
