describe('Debug Job Creation Step by Step', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.signIn() // Uses default credentials from cypress.env.json
  })

  it('should debug job creation step by step', () => {
    cy.visit('/jobs/new')
    
    console.log('=== STEP 1: Check if page loads ===')
    cy.url().then(url => {
      console.log('Job creation page URL:', url)
    })
    
    cy.get('body').should('exist')
    
    console.log('=== STEP 2: Check form elements ===')
    cy.get('body').then($body => {
      console.log('Page title:', $body.find('h1').text())
      console.log('Has title input:', $body.find('input[id="title"]').length > 0)
      console.log('Has description textarea:', $body.find('textarea[id="description"]').length > 0)
      console.log('Has category select:', $body.find('select[id="category"]').length > 0)
      console.log('Has budget_type select:', $body.find('select[id="budget_type"]').length > 0)
      console.log('Has budget_amount input:', $body.find('input[id="budget_amount"]').length > 0)
      console.log('Has deadline input:', $body.find('input[id="deadline"]').length > 0)
      console.log('Has postcode input:', $body.find('input[id="postcode"]').length > 0)
      console.log('Has submit button:', $body.find('button[type="submit"]').length > 0)
    })
    
    console.log('=== STEP 3: Fill form with test data ===')
    const timestamp = Date.now()
    
    cy.get('input[id="title"]').type(`Test Job ${timestamp}`)
    cy.get('textarea[id="description"]').type('Test job description created at ' + new Date().toISOString())
    cy.get('select[id="category"]').select('cleaning') // Try selecting a category
    cy.get('select[id="budget_type"]').select('fixed')
    cy.get('input[id="budget_amount"]').type('100')
    cy.get('input[id="deadline"]').type('2024-12-31')
    cy.get('input[id="postcode"]').type('12345')
    
    console.log('=== STEP 4: Submit form ===')
    cy.get('button[type="submit"]').click()
    
    // Wait for response
    cy.wait(3000)
    
    console.log('=== STEP 5: Check results ===')
    cy.get('body').invoke('text').then(text => {
      console.log('Page content after submission:', text.substring(0, 500))
      
      if (text.includes('Only employers can create jobs')) {
        console.log('❌ 403 ERROR: Profile role issue')
      } else if (text.includes('Validation failed')) {
        console.log('❌ 400 ERROR: Form validation failed')
        console.log('Validation errors:', text.match(/Validation failed: [^.]*/))
      } else if (text.includes('Invalid category')) {
        console.log('❌ 400 ERROR: Invalid category')
      } else if (text.includes('error') || text.includes('Error')) {
        console.log('❌ API ERROR: ', text.match(/error[^.]*\./i))
      } else {
        console.log('✅ SUCCESS: No error messages found!')
        console.log('Checking URL...')
      }
    })
    
    cy.url().then(url => {
      console.log('URL after submission:', url)
      
      if (url.includes('/dashboard')) {
        console.log('✅ SUCCESS: Redirected to dashboard')
      } else if (url.includes('/jobs/new')) {
        console.log('⚠️ WARNING: Still on job creation page')
      } else {
        console.log('❓ UNKNOWN: Unexpected URL')
      }
    })
  })

  it('should check if categories load correctly', () => {
    cy.visit('/jobs')
    
    cy.get('body').invoke('text').then(text => {
      console.log('=== JOBS PAGE CONTENT ===')
      console.log('Jobs page content:', text.substring(0, 300))
      
      if (text.includes('No jobs found') || text.includes('No jobs available')) {
        console.log('❌ NO JOBS FOUND - might be database issue')
      } else {
        console.log('✅ Jobs found on page')
      }
    })
  })

  it('should check if user has employer permissions in dashboard', () => {
    cy.visit('/dashboard')
    
    cy.get('body').invoke('text').then(text => {
      console.log('=== DASHBOARD CONTENT ===')
      console.log('Dashboard content:', text.substring(0, 300))
      
      // Look for employer indicators
      const employerIndicators = [
        'Post Job', 'Create Job', 'New Job', 'Add Job',
        'Manage Jobs', 'My Jobs', 'Posted Jobs',
        'Applications', 'Applicants', 'Hiring'
      ]
      
      const foundIndicators = employerIndicators.filter(indicator => 
        text.toLowerCase().includes(indicator.toLowerCase())
      )
      
      console.log('Employer indicators found:', foundIndicators)
      
      if (foundIndicators.length > 0) {
        console.log('✅ User appears to have employer features')
      } else {
        console.log('❌ No employer features found - might be worker account')
      }
    })
  })
})
