// Custom Cypress commands for your application

// Define interfaces for better type safety
interface JobData {
  title: string
  description: string
  category: string
  budget_type: string
  budget_amount: number
  deadline: string
  postcode: string
}

// Export the module to enable global augmentation
export {}

// Declare custom commands for TypeScript BEFORE adding them
declare global {
  namespace Cypress {
    interface Chainable {
      signUp(email: string, password: string, firstName: string, lastName: string, role: string): any
      signIn(email: string, password: string): any
      createJob(jobData: JobData): any
    }
  }
}

// Custom command for signing up
Cypress.Commands.add('signUp', (email: string, password: string, firstName: string, lastName: string, role: string) => {
  cy.visit('/auth/sign-up')
  cy.get('input[id="email"]').type(email)
  cy.get('input[id="password"]').type(password)
  cy.get('input[id="confirmPassword"]').type(password)
  cy.get('input[id="first_name"]').type(firstName)
  cy.get('input[id="last_name"]').type(lastName)
  cy.get('select[id="role"]').select(role)
  cy.get('button[type="submit"]').click()
})

// Custom command for signing in
Cypress.Commands.add('signIn', (email: string, password: string) => {
  cy.visit('/auth/sign-in')
  cy.get('input[id="email"]').type(email)
  cy.get('input[id="password"]').type(password)
  cy.get('button[type="submit"]').click()
})

// Custom command for creating a test job
Cypress.Commands.add('createJob', (jobData: JobData) => {
  cy.visit('/jobs/new')
  cy.get('input[id="title"]').type(jobData.title)
  cy.get('textarea[id="description"]').type(jobData.description)
  cy.get('select[id="category"]').select(jobData.category)
  cy.get('select[id="budget_type"]').select(jobData.budget_type)
  cy.get('input[id="budget_amount"]').type(jobData.budget_amount.toString())
  cy.get('input[id="deadline"]').type(jobData.deadline)
  cy.get('input[id="postcode"]').type(jobData.postcode)
  cy.get('button[type="submit"]').click()
})
