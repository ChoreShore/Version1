describe('Test New Sign-Up Flow', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('should test new employer sign-up', () => {
    const timestamp = Date.now()
    const userEmail = `new-employer-${timestamp}@example.com`
    const userPassword = 'TestPassword123!'

    cy.visit('/auth/sign-up')
    
    // Fill out the sign-up form
    cy.get('input[id="email"]').type(userEmail)
    cy.get('input[id="password"]').type(userPassword)
    cy.get('input[id="confirmPassword"]').type(userPassword)
    cy.get('input[id="first_name"]').type('New')
    cy.get('input[id="last_name"]').type('Employer')
    cy.get('select[id="role"]').select('employer')
    
    // Submit the form
    cy.get('button[type="submit"]').click()
    
    // Check what happens after submission
    cy.wait(2000)
    
    cy.get('body').invoke('text').then(text => {
      console.log('=== SIGN-UP RESULT ===')
      console.log('Page content:', text.substring(0, 300))
      
      if (text.includes('Failed to create user profile')) {
        console.log('❌ PROFILE CREATION FAILED - This is the root cause!')
        console.log('Error message:', text.match(/Failed to create user profile: [^.]*/))
      } else if (text.includes('Sign in') || text.includes('sign-in')) {
        console.log('✅ Sign-up successful, redirected to sign-in')
      } else if (text.includes('error') || text.includes('Error')) {
        console.log('❌ Sign-up failed with error')
        console.log('Error details:', text.match(/error[^.]*\./i))
      } else {
        console.log('❓ Unclear sign-up result')
      }
    })
    
    // Check URL after submission
    cy.url().then(url => {
      console.log('URL after sign-up:', url)
    })
  })

  it('should verify if profile was created after sign-up', () => {
    const timestamp = Date.now()
    const userEmail = `profile-test-${timestamp}@example.com`
    const userPassword = 'TestPassword123!'

    cy.visit('/auth/sign-up')
    
    // Fill out the sign-up form
    cy.get('input[id="email"]').type(userEmail)
    cy.get('input[id="password"]').type(userPassword)
    cy.get('input[id="confirmPassword"]').type(userPassword)
    cy.get('input[id="first_name"]').type('Profile')
    cy.get('input[id="last_name"]').type('Test')
    cy.get('select[id="role"]').select('employer')
    
    // Submit the form
    cy.get('button[type="submit"]').click()
    
    // Wait for redirect
    cy.wait(2000)
    
    // Try to sign in to test if profile was created
    cy.signIn(userEmail, userPassword)
    
    // Try to create a job to test employer permissions
    cy.visit('/jobs/new')
    
    // Fill job form
    cy.get('input[id="title"]').type('Test Job After Sign-Up')
    cy.get('textarea[id="description"]').type('Test job description')
    cy.get('select[id="category"]').select('cleaning')
    cy.get('select[id="budget_type"]').select('fixed')
    cy.get('input[id="budget_amount"]').type('100')
    cy.get('input[id="deadline"]').type('2024-12-31')
    cy.get('input[id="postcode"]').type('12345')
    
    // Submit job
    cy.get('button[type="submit"]').click()
    
    // Check if job creation works
    cy.wait(2000)
    cy.get('body').invoke('text').then(text => {
      console.log('=== JOB CREATION AFTER SIGN-UP ===')
      console.log('Page content:', text.substring(0, 300))
      
      if (text.includes('Only employers can create jobs')) {
        console.log('❌ PROFILE NOT CREATED - Still getting 403 error')
      } else if (text.includes('success') || text.includes('created')) {
        console.log('✅ PROFILE CREATED - Job creation successful!')
      } else {
        console.log('❓ Unclear result from job creation')
      }
    })
  })
})
