describe('Investigate App Content', () => {
  it('should check what text is on sign-up page', () => {
    cy.visit('/auth/sign-up')
    cy.get('body').then($body => {
      const text = $body.text()
      console.log('Sign-up page content:', text)
      // Just check that page loads without specific text
      expect(text).to.not.be.empty
    })
  })

  it('should check what text is on sign-in page', () => {
    cy.visit('/auth/sign-in')
    cy.get('body').then($body => {
      const text = $body.text()
      console.log('Sign-in page content:', text)
      expect(text).to.contain('Sign in')
    })
  })

  it('should check homepage behavior', () => {
    cy.visit('/')
    cy.url().then(url => {
      console.log('Homepage URL after visit:', url)
    })
    cy.get('body').then($body => {
      const text = $body.text()
      console.log('Homepage content:', text)
    })
  })

  it('should check navigation flow', () => {
    cy.visit('/auth/sign-in')
    cy.url().then(url => {
      console.log('Sign-in URL:', url)
    })
    
    cy.visit('/auth/sign-up')
    cy.url().then(url => {
      console.log('Sign-up URL:', url)
    })
    
    cy.visit('/')
    cy.url().then(url => {
      console.log('Homepage URL:', url)
    })
  })
})
