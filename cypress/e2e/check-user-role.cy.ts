describe('Check User Role and Permissions', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.signIn(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
  })

  it('should verify user role and permissions', () => {
    cy.visit('/dashboard')
    
    // Check page content for role indicators
    cy.get('body').invoke('text').then(text => {
      console.log('=== DASHBOARD CONTENT ANALYSIS ===')
      console.log('Full dashboard text:', text)
      
      // Look for explicit role mentions
      const rolePatterns = [
        /role\s*:\s*(\w+)/i,
        /account\s*type\s*:\s*(\w+)/i,
        /user\s*type\s*:\s*(\w+)/i,
        /(employer|worker|client|freelancer)/i
      ]
      
      rolePatterns.forEach(pattern => {
        const match = text.match(pattern)
        if (match) {
          console.log('Found role pattern:', match[0])
        }
      })
      
      // Check for employer-specific features
      const employerFeatures = [
        'post job', 'create job', 'new job', 'add job',
        'manage jobs', 'my jobs', 'posted jobs',
        'applications', 'applicants', 'hiring'
      ]
      
      const foundFeatures = employerFeatures.filter(feature => 
        text.toLowerCase().includes(feature.toLowerCase())
      )
      
      console.log('Employer features found:', foundFeatures)
      
      // Check for worker-specific features
      const workerFeatures = [
        'find work', 'browse jobs', 'apply for jobs',
        'my applications', 'job search', 'available jobs'
      ]
      
      const foundWorkerFeatures = workerFeatures.filter(feature => 
        text.toLowerCase().includes(feature.toLowerCase())
      )
      
      console.log('Worker features found:', foundWorkerFeatures)
      
      // Determine likely role
      if (foundFeatures.length > foundWorkerFeatures.length) {
        console.log('✅ CONCLUSION: User appears to have EMPLOYER role')
      } else if (foundWorkerFeatures.length > 0) {
        console.log('❌ CONCLUSION: User appears to have WORKER role')
        console.log('⚠️ This would explain why job posting is not working!')
      } else {
        console.log('❓ CONCLUSION: Role unclear - need manual investigation')
      }
    })
  })

  it('should check navigation options for job posting', () => {
    cy.visit('/dashboard')
    
    // Find all links and buttons
    const jobRelatedElements = []
    
    cy.get('a').each($link => {
      const href = $link.attr('href')
      const text = $link.text().trim()
      
      if (href && (href.includes('job') || href.includes('post'))) {
        jobRelatedElements.push({ type: 'link', text, href })
      }
    })
    
    cy.get('button').each($button => {
      const text = $button.text().trim()
      
      if (text.includes('Job') || text.includes('Post') || text.includes('Create')) {
        jobRelatedElements.push({ type: 'button', text })
      }
    })
    
    cy.then(() => {
      console.log('=== JOB-RELATED NAVIGATION ELEMENTS ===')
      jobRelatedElements.forEach(element => {
        console.log(`${element.type}: "${element.text}" ${element.href ? '-> ' + element.href : ''}`)
      })
      
      if (jobRelatedElements.length === 0) {
        console.log('❌ No job posting navigation found - confirms permission issue')
      }
    })
  })

  it('should try to access job creation page directly', () => {
    cy.visit('/jobs/new', { failOnStatusCode: false })
    
    cy.url().then(url => {
      console.log('Job creation URL result:', url)
      
      if (url.includes('/auth/sign-in')) {
        console.log('❌ Redirected to sign-in - permission issue')
      } else if (url.includes('/dashboard')) {
        console.log('❌ Redirected to dashboard - permission issue')
      } else if (url.includes('/jobs/new')) {
        console.log('✅ Can access job creation page')
        
        // Check if form loads
        cy.get('body').invoke('text').then(text => {
          if (text.includes('unauthorized') || text.includes('permission')) {
            console.log('❌ Permission error on job creation page')
          } else if (text.includes('title') || text.includes('description')) {
            console.log('✅ Job creation form appears to load')
          } else {
            console.log('❓ Job creation page content unclear')
          }
        })
      }
    })
  })
})
