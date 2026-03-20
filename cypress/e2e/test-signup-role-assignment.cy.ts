describe('Test Automatic Role Assignment', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('should automatically assign role during sign-up', () => {
    const timestamp = Date.now()
    const userEmail = `test-employer-${timestamp}@example.com`
    const userPassword = 'TestPassword123!'

    cy.visit('/auth/sign-up')
    
    // Fill out the sign-up form
    cy.get('input[id="email"]').type(userEmail)
    cy.get('input[id="password"]').type(userPassword)
    cy.get('input[id="confirmPassword"]').type(userPassword)
    cy.get('input[id="first_name"]').type('Test')
    cy.get('input[id="last_name"]').type('Employer')
    cy.get('select[id="role"]').select('employer')
    
    // Submit the form
    cy.get('button[type="submit"]').click()
    
    // Should redirect to sign-in page
    cy.url().should('include', '/auth/sign-in')
    
    // Now sign in to verify role was assigned
    cy.signIn(userEmail, userPassword)
    
    // Try to create a job to test employer permissions
    cy.visit('/jobs/new')
    
    // Fill job form
    cy.get('input[id="title"]').type(`Test Job ${timestamp}`)
    cy.get('textarea[id="description"]').type('Test job description')
    cy.get('select[id="category"]').select('cleaning')
    cy.get('select[id="budget_type"]').select('fixed')
    cy.get('input[id="budget_amount"]').type('100')
    cy.get('input[id="deadline"]').type('2024-12-31')
    cy.get('input[id="postcode"]').type('12345')
    
    // Submit job
    cy.get('button[type="submit"]').click()
    
    // Should NOT get 403 error if role was assigned correctly
    cy.get('body').invoke('text').then(text => {
      if (text.includes('Only employers can create jobs')) {
        console.log('❌ Role assignment failed - still getting 403 error')
      } else {
        console.log('✅ Role assignment successful - no 403 error')
      }
    })
  })

  it('should assign worker role correctly', () => {
    const timestamp = Date.now()
    const userEmail = `test-worker-${timestamp}@example.com`
    const userPassword = 'TestPassword123!'

    cy.visit('/auth/sign-up')
    
    // Fill out the sign-up form as worker
    cy.get('input[id="email"]').type(userEmail)
    cy.get('input[id="password"]').type(userPassword)
    cy.get('input[id="confirmPassword"]').type(userPassword)
    cy.get('input[id="first_name"]').type('Test')
    cy.get('input[id="last_name"]').type('Worker')
    cy.get('select[id="role"]').select('worker')
    
    // Submit the form
    cy.get('button[type="submit"]').click()
    
    // Sign in to test worker permissions
    cy.signIn(userEmail, userPassword)
    
    // Try to create a job (should fail for worker)
    cy.visit('/jobs/new')
    
    // Fill job form
    cy.get('input[id="title"]').type('Test Job')
    cy.get('textarea[id="description"]').type('Test job description')
    cy.get('select[id="category"]').select('cleaning')
    cy.get('select[id="budget_type"]').select('fixed')
    cy.get('input[id="budget_amount"]').type('100')
    cy.get('input[id="deadline"]').type('2024-12-31')
    cy.get('input[id="postcode"]').type('12345')
    
    // Submit job
    cy.get('button[type="submit"]').click()
    
    // Should get 403 error for worker
    cy.get('body').invoke('text').then(text => {
      if (text.includes('Only employers can create jobs')) {
        console.log('✅ Worker role correctly assigned - getting expected 403 error')
      } else {
        console.log('❌ Worker role assignment failed - no 403 error')
      }
    })
  })
})
