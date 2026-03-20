describe('Debug User Profile Role', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.signIn(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
  })

  it('should check user profile data', () => {
    cy.visit('/dashboard')
    
    // Try to create a job and capture the exact error
    cy.visit('/jobs/new')
    
    // Fill the form
    cy.get('input[id="title"]').type('Test Job')
    cy.get('textarea[id="description"]').type('Test Description')
    cy.get('select[id="category"]').select('cleaning')
    cy.get('select[id="budget_type"]').select('fixed')
    cy.get('input[id="budget_amount"]').type('100')
    cy.get('input[id="deadline"]').type('2024-12-31')
    cy.get('input[id="postcode"]').type('12345')
    
    // Submit and capture error
    cy.get('button[type="submit"]').click()
    
    // Look for error message
    cy.get('body').invoke('text').then(text => {
      console.log('=== JOB CREATION ERROR ANALYSIS ===')
      console.log('Page content after submission:', text)
      
      if (text.includes('Only employers can create jobs')) {
        console.log('❌ CONFIRMED: User does not have employer role in profiles table')
        console.log('🔧 SOLUTION: Update user profile in Supabase to include employer role')
      } else if (text.includes('403') || text.includes('Forbidden')) {
        console.log('❌ CONFIRMED: 403 Forbidden error - likely role issue')
      } else {
        console.log('❓ Different error - need further investigation')
      }
    })
  })

  it('should check if there are alternative ways to set role', () => {
    // Look for role management in the UI
    cy.visit('/dashboard')
    
    cy.get('body').invoke('text').then(text => {
      console.log('=== LOOKING FOR ROLE MANAGEMENT ===')
      console.log('Dashboard content:', text)
      
      // Look for role settings or profile management
      const roleManagementKeywords = [
        'profile', 'settings', 'role', 'account', 'edit profile',
        'update profile', 'change role', 'become employer'
      ]
      
      const foundOptions = roleManagementKeywords.filter(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      )
      
      console.log('Profile/role management options found:', foundOptions)
      
      if (foundOptions.length > 0) {
        console.log('✅ User might be able to set role through UI')
      } else {
        console.log('❌ No UI role management found - need Supabase admin access')
      }
    })
  })
})
