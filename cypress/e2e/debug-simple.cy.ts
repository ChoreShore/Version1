describe('Simple Debug Tests', () => {
  it('should check sign-up page content', () => {
    cy.visit('/auth/sign-up')
    
    // Check if page loads at all
    cy.get('body').should('exist')
    
    // Check for any common text patterns
    cy.get('body').invoke('text').then(text => {
      console.log('Sign-up page text:', text.substring(0, 200))
      
      // Look for common sign-up related text
      const hasSignUp = text.includes('Sign Up')
      const hasCreateAccount = text.includes('Create Account')
      const hasRegister = text.includes('Register')
      const hasEmail = text.includes('Email')
      const hasPassword = text.includes('Password')
      
      console.log('Contains Sign Up:', hasSignUp)
      console.log('Contains Create Account:', hasCreateAccount)
      console.log('Contains Register:', hasRegister)
      console.log('Contains Email:', hasEmail)
      console.log('Contains Password:', hasPassword)
      
      // At least one of these should be true
      expect(hasSignUp || hasCreateAccount || hasRegister || hasEmail || hasPassword).to.be.true
    })
  })

  it('should check homepage redirect behavior', () => {
    cy.visit('/')
    
    cy.url().then(url => {
      console.log('Final URL after visiting homepage:', url)
      
      // Check if we're still on homepage or redirected
      const isHomepage = url === 'https://version1-seven.vercel.app/' || 
                        url === 'https://version1-seven.vercel.app'
      const isAuthPage = url.includes('/auth/')
      
      console.log('Is homepage:', isHomepage)
      console.log('Is auth page:', isAuthPage)
      
      // Either is fine, just log the behavior
      expect(isHomepage || isAuthPage).to.be.true
    })
  })
})
