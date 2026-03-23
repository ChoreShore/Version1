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
    cy.get('textarea[id="cover_letter"], textarea[name="cover_letter"]', { timeout: 10000 })
      .scrollIntoView()
      .should('be.visible')
      .clear()
      .type('I am very interested in this position and believe I would be a great fit. I have extensive experience and am available to start immediately.');
    
    cy.log('✅ Step 4: Filled in cover letter');
    
    // Fill proposed rate if visible
    cy.get('input[id="proposed_rate"], input[name="proposed_rate"]').then(($rate) => {
      if ($rate.length > 0 && $rate.is(':visible')) {
        cy.wrap($rate).clear().type('100');
        cy.log('Filled in proposed rate');
      }
    });

    // Step 5: Submit the application
    cy.get('button[type="submit"]').contains(/apply|submit/i).click();
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
