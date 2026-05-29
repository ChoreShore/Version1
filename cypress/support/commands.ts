// Custom Cypress commands for your application

// Define interfaces for better type safety
interface JobData {
  title: string
  description: string
  category: string // category ID (UUID)
  budget_type: string
  budget_amount: number
  deadline: string
  postcode: string
}

// Export the module to enable global augmentation
export {}

interface MockLoginOptions {
  userId?: string
  email?: string
  firstName?: string
  lastName?: string
  roles?: ('employer' | 'worker')[]
  activeRole?: 'employer' | 'worker'
  rtwStatus?: 'unverified' | 'verified' | 'pending'
  rtwExpiryDate?: string | null
}

// Declare custom commands for TypeScript BEFORE adding them
declare global {
  namespace Cypress {
    interface Chainable {
      signUp(email: string, password: string, firstName: string, lastName: string, role: string): any
      login(email?: string, password?: string): any
      signIn(email?: string, password?: string): any
      mockLogin(options?: MockLoginOptions): Chainable<void>
      createJob(jobData: JobData): any
      createJobViaApi(jobData: JobData): Chainable<{ job: any }>
      deleteJob(jobId: string): Chainable<Cypress.Response<any>>
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

// Fast programmatic login — hits the real API and stores the Supabase session cookie
Cypress.Commands.add('login', (email?: string, password?: string) => {
  const testEmail = email || Cypress.env('TEST_EMAIL')
  const testPassword = password || Cypress.env('TEST_PASSWORD')

  if (!testEmail || !testPassword) {
    throw new Error(
      'login: credentials are missing. Set CYPRESS_TEST_EMAIL and CYPRESS_TEST_PASSWORD environment variables.'
    )
  }

  cy.request({
    method: 'POST',
    url: '/api/auth/signin',
    headers: { Origin: Cypress.config('baseUrl') as string },
    body: { email: testEmail, password: testPassword },
    failOnStatusCode: true
  })
})

// UI-based sign-in — goes directly to Supabase (no CSRF, no server rate limit)
// Waits for the redirect so cy.session() captures a fully-established session
Cypress.Commands.add('signIn', (email?: string, password?: string) => {
  const testEmail = email || Cypress.env('TEST_EMAIL')
  const testPassword = password || Cypress.env('TEST_PASSWORD')

  if (!testEmail || !testPassword) {
    throw new Error(
      'signIn: credentials are missing. Set CYPRESS_TEST_EMAIL and CYPRESS_TEST_PASSWORD environment variables.'
    )
  }

  cy.visit('/auth/sign-in')
  // Wait for Vue SSR hydration to finish before interacting
  cy.wait(500)
  cy.get('input[id="email"]').should('be.visible').clear().type(testEmail, { delay: 0 })
  cy.get('input[id="password"]').clear().type(testPassword, { delay: 0 })
  // Wait for Vue's canSubmit computed to enable the button, then click
  cy.get('button[type="submit"]').should('not.be.disabled').click()
  // Wait until we navigate away from sign-in — session is now established
  cy.url({ timeout: 15000 }).should('not.include', '/auth/sign-in')
})

// Mock login — bypasses real auth by intercepting Supabase and app auth endpoints
Cypress.Commands.add('mockLogin', (options?: MockLoginOptions) => {
  const opts = {
    userId: 'mock-user-id',
    email: 'mock@example.com',
    firstName: 'Mock',
    lastName: 'User',
    roles: ['employer'] as ('employer' | 'worker')[],
    activeRole: 'employer' as 'employer' | 'worker',
    rtwStatus: 'unverified' as 'unverified' | 'verified' | 'pending',
    rtwExpiryDate: null as string | null,
    ...options
  }

  // 1. Intercept Supabase auth user check (used by useSupabaseUser)
  cy.intercept('GET', '**/auth/v1/user', {
    statusCode: 200,
    body: {
      data: {
        user: {
          id: opts.userId,
          email: opts.email,
          role: 'authenticated',
          user_metadata: {
            first_name: opts.firstName,
            last_name: opts.lastName
          }
        }
      }
    }
  }).as('mockGetUser')

  // 2. Intercept app's /api/auth/me (used by useActiveRole to fetch roles)
  cy.intercept('GET', '/api/auth/me', {
    statusCode: 200,
    body: {
      user: {
        id: opts.userId,
        email: opts.email,
        roles: opts.roles
      }
    }
  }).as('mockGetMe')

  // 3. Intercept Supabase profiles query (used by useRtw for rtw_status)
  cy.intercept('GET', '**/rest/v1/profiles?select=rtw_status,rtw_expiry_date&id=eq.**', {
    statusCode: 200,
    body: [
      {
        rtw_status: opts.rtwStatus,
        rtw_expiry_date: opts.rtwExpiryDate
      }
    ]
  }).as('mockGetProfile')

  // 4. Seed localStorage and cookies so the Supabase client and role switcher start in the right state
  // Generate a structurally valid mock JWT for Supabase to successfully parse/decode on load
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadStr = JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: opts.userId,
    email: opts.email,
    role: 'authenticated',
    aud: 'authenticated',
    user_metadata: {
      first_name: opts.firstName,
      last_name: opts.lastName
    }
  })
  // Native btoa in Node / Electron environments
  const payload = btoa(payloadStr).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const mockJwt = `${header}.${payload}.mock-signature`

  const mockSession = {
    access_token: mockJwt,
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: opts.userId,
      email: opts.email,
      role: 'authenticated',
      user_metadata: {
        first_name: opts.firstName,
        last_name: opts.lastName
      }
    }
  }

  cy.window().then((win) => {
    win.localStorage.setItem('active-role', opts.activeRole)
    win.localStorage.setItem('sb-localhost-auth-token', JSON.stringify(mockSession))
  })

  // Set cookies for Nuxt Supabase server/client synchronization
  cy.setCookie('sb-access-token', mockJwt)
  cy.setCookie('sb-refresh-token', 'mock-refresh-token')
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

// Custom command for creating a test job via UI (multi-step wizard)
Cypress.Commands.add('createJob', (jobData: JobData) => {
  cy.visit('/jobs/new')

  // Step 0: Basic Info
  cy.get('input[id="title"]').type(jobData.title)
  cy.get('select[id="category"]').select(jobData.category)
  cy.get('.job-form__submit').contains('Next').click()

  // Step 1: Description
  cy.get('textarea[id="description"]').type(jobData.description)
  cy.get('.job-form__submit').contains('Next').click()

  // Step 2: Budget & Timeline
  cy.get('select[id="budget_type"]').select(jobData.budget_type)
  cy.get('input[id="budget_amount"]').type(jobData.budget_amount.toString())
  cy.get('input[id="deadline"]').type(jobData.deadline)
  cy.get('.job-form__submit').contains('Next').click()

  // Step 3: Location
  cy.get('input[id="postcode"]').type(jobData.postcode)
  cy.get('.job-form__submit').contains('Next').click()

  // Step 4: Review & Submit
  cy.get('.job-form__submit').contains('Post a job').click()
})

// Fast programmatic job creation — returns the created job for cleanup
Cypress.Commands.add('createJobViaApi', (jobData: JobData) => {
  return cy.request({
    method: 'POST',
    url: '/api/jobs',
    headers: { Origin: Cypress.config('baseUrl') as string },
    body: {
      title: jobData.title,
      description: jobData.description,
      category_id: jobData.category,
      budget_type: jobData.budget_type,
      budget_amount: jobData.budget_amount,
      deadline: jobData.deadline,
      postcode: jobData.postcode
    },
    failOnStatusCode: true
  }).then((response) => {
    expect(response.status).to.equal(200)
    return response.body as { job: any }
  })
})

// Delete a job by ID via API — used for cleanup
Cypress.Commands.add('deleteJob', (jobId: string) => {
  return cy.request({
    method: 'DELETE',
    url: `/api/jobs/${jobId}`,
    headers: { Origin: Cypress.config('baseUrl') as string },
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200 || response.status === 404) {
      cy.log(`Deleted job ${jobId}`)
    } else {
      cy.log(`Could not delete job ${jobId}: ${response.status} ${response.body?.statusMessage || ''}`)
    }
  })
})
