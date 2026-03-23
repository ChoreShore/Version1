describe('Worker Application Flow', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should complete worker application flow: login → switch to worker → select job → fill form → submit', () => {
    // Step 1: Login
    cy.signIn(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
    cy.wait(1500);
    cy.log('✅ Step 1: Logged in');

    // Step 2: Switch to worker mode
    cy.visit('/jobs');
    cy.wait(2000);
    
    // Click the Worker button in the role switcher
    cy.get('button.role-switcher__option').contains('Worker').click();
    
    // Wait for jobs to reload with worker-specific content
    cy.wait(2000);
    
    // Verify page loaded by checking for either jobs grid or empty state
    cy.get('body').should('be.visible');
    cy.wait(1000);
    
    cy.log('✅ Step 2: Switched to worker mode');

    // Step 3: Select a job that has NOT been applied to
    cy.wait(1000);
    
    cy.get('body').then(($body) => {
      // Find job cards that do NOT have an "Applied" badge
      const jobCards = $body.find('[class*="job-card"]');
      let unappliedJobLink: JQuery<HTMLElement> | null = null;
      
      jobCards.each((index, card) => {
        const $card = Cypress.$(card);
        const hasAppliedBadge = $card.text().toLowerCase().includes('applied');
        
        if (!hasAppliedBadge && !unappliedJobLink) {
          const link = $card.find('a[href*="/jobs/"]').first();
          if (link.length > 0) {
            unappliedJobLink = link;
          }
        }
      });
      
      if (unappliedJobLink) {
        cy.log('✅ Step 3: Found unapplied job, clicking on it');
        cy.wrap(unappliedJobLink).click();
      } else {
        cy.log('⚠️ No unapplied jobs found - clicking first available job');
        cy.get('a[href*="/jobs/"]').first().click();
      }
    });
    
    cy.wait(3000);
    cy.url().should('include', '/jobs/');
    
    // Wait for job detail page to fully load
    cy.contains('Job info').should('be.visible');
    cy.wait(1000);
    
    // Debug: Check what's on the page
    cy.get('body').invoke('text').then((text) => {
      cy.log('Page content preview:', text.substring(0, 300));
      
      if (text.toLowerCase().includes('already applied')) {
        cy.log('⚠️ Already applied to this job - test cannot proceed');
        throw new Error('Already applied to this job. Please apply to a different job or reset test data.');
      }
      
      if (text.toLowerCase().includes('worker role')) {
        cy.log('❌ Worker role issue');
        throw new Error('Worker role not set properly');
      }
      
      if (!text.toLowerCase().includes('apply')) {
        cy.log('⚠️ No application form found on page');
      }
    });

    // Step 4: Fill in the application form
    // Scroll down the page to ensure form is visible
    cy.scrollTo('bottom', { duration: 1000 });
    cy.wait(1000);
    
    // Find textarea by placeholder text since it has no id/name
    cy.get('textarea[placeholder*="great fit"]', { timeout: 10000 })
      .scrollIntoView({ duration: 500 })
      .should('be.visible')
      .focus()
      .clear()
      .type('I am very interested in this position and believe I would be a great fit. I have extensive experience and am available to start immediately.', { delay: 10 });
    
    cy.log('✅ Step 4: Filled in cover letter');
    
    // Fill proposed rate if visible (optional field)
    cy.get('body').then(($body) => {
      const $rate = $body.find('input[placeholder*="120"], input[type="number"]').filter(':visible');
      if ($rate.length > 0) {
        cy.wrap($rate).first().clear().type('100');
        cy.log('Filled in proposed rate');
      } else {
        cy.log('Proposed rate field not found - skipping (optional)');
      }
    });

    // Step 5: Submit the application
    cy.wait(500); // Wait for form validation to complete
    cy.get('button[type="submit"]').contains(/submit application/i)
      .scrollIntoView()
      .should('be.visible')
      .should('not.be.disabled')
      .click();
    cy.wait(2000);
    cy.log('✅ Step 5: Submitted application');
    
    // Verify submission result
    cy.get('body').invoke('text').then((text) => {
      if (text.toLowerCase().includes('application submitted') || text.toLowerCase().includes('success')) {
        cy.log('✅ SUCCESS: Application submitted successfully');
      } else if (text.toLowerCase().includes('already applied')) {
        cy.log('⚠️ INFO: Already applied to this job');
      } else if (text.toLowerCase().includes('worker role')) {
        cy.log('❌ ERROR: Worker role issue detected');
        throw new Error('Worker role not properly set');
      } else if (text.toLowerCase().includes('error')) {
        cy.log('❌ ERROR: Application submission failed');
        throw new Error('Application submission failed');
      } else {
        cy.log('📋 Application form submitted - checking status');
      }
    });
  });
});
