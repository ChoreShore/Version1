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
      signIn(email?: string, password?: string): any
      createJob(jobData: JobData): any
      switchToWorker(): Chainable<void>
      fillRtwForm(code: string, dob: string, forename: string, surname: string): Chainable<void>
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
Cypress.Commands.add('signIn', (email?: string, password?: string) => {
  const testEmail = email || Cypress.env('TEST_EMAIL')
  const testPassword = password || Cypress.env('TEST_PASSWORD')

  if (!testEmail || !testPassword) {
    throw new Error(
      'signIn: credentials are missing. Set TEST_EMAIL and TEST_PASSWORD in cypress.config.ts env block.'
    )
  }

  cy.visit('/auth/sign-in')
  cy.get('input[id="email"]').type(testEmail)
  cy.get('input[id="password"]').type(testPassword)
  cy.get('button[type="submit"]').click()
})

// Custom command to switch role switcher to Worker
Cypress.Commands.add('switchToWorker', () => {
  cy.get('button.role-switcher__option').contains('Worker').click()
  cy.wait(1500)
})

// Custom command to fill and submit the RTW verification modal
Cypress.Commands.add('fillRtwForm', (code: string, dob: string, forename: string, surname: string) => {
  cy.get('#rtw-code', { timeout: 10000 }).should('be.visible').clear().type(code)
  cy.get('#rtw-dob').clear().type(dob)
  cy.get('#rtw-forename').clear().type(forename)
  cy.get('#rtw-surname').clear().type(surname)
  cy.get('button.rtw-modal__submit').click()
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
