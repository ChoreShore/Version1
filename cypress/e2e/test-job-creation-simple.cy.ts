describe('Test Job Creation Simple', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.signIn()
  })

  it('should test job creation with available categories', () => {
    cy.visit('/jobs/new')
    
    // Check what categories are available
    cy.get('select[id="category"]').then($select => {
      const options = $select.find('option')
      console.log('Available categories:')
      options.each((index, option) => {
        console.log(`  ${index}: ${option.value} - ${option.text}`)
      })
      
      // Use the first available category (skip the empty option)
      const firstRealOption = options.eq(1)
      if (firstRealOption.length > 0) {
        const categoryValue = firstRealOption.val()
        const categoryText = firstRealOption.text()
        
        console.log(`Using category: ${categoryValue} (${categoryText})`)
        
        // Fill the form
        cy.get('input[id="title"]').type('Test Job ' + Date.now())
        cy.get('textarea[id="description"]').type('Test job description')
        cy.get('select[id="category"]').select(categoryValue)
        cy.get('select[id="budget_type"]').select('fixed')
        cy.get('input[id="budget_amount"]').type('100')
        cy.get('input[id="deadline"]').type('2024-12-31')
        cy.get('input[id="postcode"]').type('12345')
        
        // Submit the form
        cy.get('button[type="submit"]').click()
        
        // Check result
        cy.wait(3000)
        cy.get('body').invoke('text').then(text => {
          console.log('Result:', text.substring(0, 300))
          
          if (text.includes('Only employers can create jobs')) {
            console.log('❌ Still 403 error - role issue')
          } else if (text.includes('Validation failed')) {
            console.log('❌ Validation error')
          } else if (text.includes('Invalid category')) {
            console.log('❌ Category still invalid')
          } else {
            console.log('✅ Success or different error')
          }
        })
        
        cy.url().then(url => {
          console.log('Final URL:', url)
        })
      } else {
        console.log('❌ No categories available')
      }
    })
  })

  it('should check if categories API works', () => {
    cy.request('/api/jobs/categories').then(response => {
      console.log('Categories API response:', response.body)
      
      if (response.body.categories) {
        console.log('Available categories from API:')
        response.body.categories.forEach((cat, index) => {
          console.log(`  ${index}: ${cat.id} - ${cat.name}`)
        })
      } else {
        console.log('❌ No categories returned from API')
      }
    })
  })
})
