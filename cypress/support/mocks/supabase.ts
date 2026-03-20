// Mock Supabase responses for E2E testing

export const mockSupabaseResponses = {
  // Auth responses
  auth: {
    signUp: {
      success: {
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            email_confirmed_at: null,
            created_at: new Date().toISOString()
          },
          session: null
        },
        error: null
      },
      emailExists: {
        data: null,
        error: {
          message: 'User already registered',
          status: 400
        }
      },
      weakPassword: {
        data: null,
        error: {
          message: 'Password should be at least 6 characters',
          status: 400
        }
      }
    },
    signIn: {
      success: {
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            role: 'authenticated'
          },
          session: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_at: Date.now() + 3600000,
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              role: 'authenticated'
            }
          }
        },
        error: null
      },
      invalidCredentials: {
        data: null,
        error: {
          message: 'Invalid login credentials',
          status: 400
        }
      },
      unconfirmed: {
        data: null,
        error: {
          message: 'Email not confirmed',
          status: 400
        }
      }
    },
    signOut: {
      success: {
        data: {},
        error: null
      }
    },
    resetPassword: {
      success: {
        data: {},
        error: null
      },
      emailNotFound: {
        data: null,
        error: {
          message: 'User not found',
          status: 400
        }
      }
    },
    getUser: {
      authenticated: {
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            role: 'authenticated',
            user_metadata: {
              first_name: 'Test',
              last_name: 'User',
              role: 'worker'
            }
          }
        },
        error: null
      },
      unauthenticated: {
        data: {
          user: null
        },
        error: null
      }
    }
  },

  // Database responses
  database: {
    jobs: {
      create: {
        success: {
          data: {
            id: 'test-job-id',
            title: 'Test Job',
            description: 'Test Description',
            budget_amount: 100,
            budget_type: 'fixed',
            category: 'cleaning',
            deadline: '2024-12-31',
            postcode: '12345',
            created_by: 'test-user-id',
            created_at: new Date().toISOString()
          },
          error: null
        },
        error: {
          data: null,
          error: {
            message: 'Failed to create job',
            status: 400
          }
        }
      },
      list: {
        success: {
          data: [
            {
              id: 'job-1',
              title: 'Cleaning Service',
              description: 'Professional cleaning',
              budget_amount: 50,
              budget_type: 'fixed',
              category: 'cleaning',
              deadline: '2024-12-31',
              postcode: '12345',
              created_by: 'employer-1',
              created_at: new Date().toISOString()
            },
            {
              id: 'job-2',
              title: 'Gardening',
              description: 'Garden maintenance',
              budget_amount: 75,
              budget_type: 'hourly',
              category: 'gardening',
              deadline: '2024-12-25',
              postcode: '67890',
              created_by: 'employer-2',
              created_at: new Date().toISOString()
            }
          ],
          error: null
        }
      }
    },
    applications: {
      create: {
        success: {
          data: {
            id: 'test-application-id',
            job_id: 'test-job-id',
            worker_id: 'test-user-id',
            message: 'I am interested in this job',
            status: 'pending',
            created_at: new Date().toISOString()
          },
          error: null
        }
      },
      list: {
        success: {
          data: [
            {
              id: 'app-1',
              job_id: 'job-1',
              worker_id: 'worker-1',
              message: 'I can do this job',
              status: 'pending',
              created_at: new Date().toISOString()
            }
          ],
          error: null
        }
      }
    }
  }
}

// Helper functions to mock specific scenarios
export const mockAuthFlow = (scenario: 'success' | 'invalidCredentials' | 'unconfirmed' | 'emailExists') => {
  cy.intercept('POST', '**/auth/v1/signup', {
    statusCode: scenario === 'success' ? 200 : 400,
    body: mockSupabaseResponses.auth.signUp[scenario]
  }).as('signUp')

  cy.intercept('POST', '**/auth/v1/token?grant_type=password', {
    statusCode: scenario === 'success' ? 200 : 400,
    body: mockSupabaseResponses.auth.signIn[scenario]
  }).as('signIn')
}

export const mockJobCreation = (scenario: 'success' | 'error') => {
  cy.intercept('POST', '**/rest/v1/jobs', {
    statusCode: scenario === 'success' ? 201 : 400,
    body: mockSupabaseResponses.database.jobs.create[scenario]
  }).as('createJob')
}

export const mockJobList = () => {
  cy.intercept('GET', '**/rest/v1/jobs*', {
    statusCode: 200,
    body: mockSupabaseResponses.database.jobs.list.success
  }).as('getJobs')
}

export const mockUserSession = (authenticated: boolean) => {
  cy.intercept('GET', '**/auth/v1/user', {
    statusCode: 200,
    body: mockSupabaseResponses.auth.getUser[authenticated ? 'authenticated' : 'unauthenticated']
  }).as('getUser')
}
