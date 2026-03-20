describe('Test API Directly', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('should test job creation API directly', () => {
    // First sign in to get session
    cy.signIn()
    
    // Wait a moment for session to be established
    cy.wait(2000)
    
    // Test the API directly
    cy.request({
      method: 'POST',
      url: '/api/jobs',
      body: {
        title: 'Direct API Test Job',
        description: 'Test job created via direct API call',
        category_id: '550e8400-e29b-41d4-a716-446655440000',
        budget_type: 'fixed',
        budget_amount: 100,
        deadline: '2024-12-31',
        postcode: '12345'
      },
      failOnStatusCode: false
    }).then(response => {
      console.log('=== DIRECT API TEST RESULTS ===')
      console.log('Status Code:', response.status)
      console.log('Status Text:', response.statusText)
      console.log('Response Headers:', response.headers)
      console.log('Response Body:', response.body)
      
      if (response.status === 403) {
        console.log('❌ 403 FORBIDDEN ERROR')
        if (response.body?.statusMessage) {
          console.log('Error Message:', response.body.statusMessage)
          
          if (response.body.statusMessage.includes('Profile not found')) {
            console.log('✅ NEW CODE DEPLOYED: Profile not found error')
          } else if (response.body.statusMessage.includes('Only employers can create jobs')) {
            console.log('❓ ROLE ISSUE: Employer role check failed')
          } else {
            console.log('❓ OTHER ERROR: Different error message')
          }
        }
      } else if (response.status === 200) {
        console.log('✅ SUCCESS: Job created successfully!')
        console.log('Created Job:', response.body)
      } else if (response.status === 400) {
        console.log('❌ BAD REQUEST: Validation error')
        console.log('Validation Errors:', response.body)
      } else {
        console.log('❓ UNKNOWN: Unexpected status code')
      }
    })
  })

  it('should test categories API first', () => {
    cy.request('/api/jobs/categories').then(response => {
      console.log('=== CATEGORIES API ===')
      console.log('Status:', response.status)
      console.log('Categories:', response.body)
      
      if (response.status === 200 && response.body.categories) {
        console.log('Available categories:')
        response.body.categories.forEach((cat, index) => {
          console.log(`  ${index}: ${cat.id} - ${cat.name}`)
        })
      } else {
        console.log('❌ Categories API failed')
      }
    })
  })

  it('should test with different category IDs', () => {
    // First sign in
    cy.signIn()
    cy.wait(2000)
    
    // Try different category UUIDs
    const testCategories = [
      '550e8400-e29b-41d4-a716-446655440000', // cleaning
      '550e8400-e29b-41d4-a716-446655440001', // gardening
      '550e8400-e29b-41d4-a716-446655440002', // plumbing
    ]
    
    testCategories.forEach((categoryId, index) => {
      cy.request({
        method: 'POST',
        url: '/api/jobs',
        body: {
          title: `Test Job ${index + 1}`,
          description: 'Test job description',
          category_id: categoryId,
          budget_type: 'fixed',
          budget_amount: 100,
          deadline: '2024-12-31',
          postcode: '12345'
        },
        failOnStatusCode: false
      }).then(response => {
        console.log(`=== CATEGORY TEST ${index + 1} (${categoryId}) ===`)
        console.log('Status:', response.status)
        
        if (response.status === 403) {
          console.log('❌ 403 - Role issue persists')
        } else if (response.status === 400) {
          console.log('❌ 400 - Category might not exist')
        } else if (response.status === 200) {
          console.log('✅ 200 - SUCCESS with this category!')
        }
      })
    })
  })
})
