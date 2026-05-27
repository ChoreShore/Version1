<template>
  <div class="public-layout">
    <!-- Public Navigation -->
    <header class="public-layout__header">
      <div class="public-layout__header-inner">
        <NuxtLink to="/" class="public-layout__logo">
          <span class="public-layout__logo-icon">🐝</span>
          <div>
            <span class="public-layout__logo-name">HireBeHired</span>
            <span class="public-layout__logo-tagline">Find · Hire · Earn</span>
          </div>
        </NuxtLink>

        <nav class="public-layout__nav">
          <NuxtLink to="/jobs/public" class="public-layout__nav-link">Find Jobs</NuxtLink>
          <NuxtLink to="/workers/public" class="public-layout__nav-link">Find Workers</NuxtLink>
        </nav>

        <div class="public-layout__actions">
          <NuxtLink to="/jobs/new" class="btn btn--primary btn--post">Post a job</NuxtLink>
          <NuxtLink to="/auth/sign-in" class="btn btn--ghost">Sign in</NuxtLink>
          <NuxtLink to="/auth/sign-up" class="btn btn--outline">Sign up</NuxtLink>
        </div>
      </div>
    </header>

    <!-- Page Content -->
    <main class="public-layout__content">
      <slot />
    </main>

    <!-- Public Footer -->
    <footer class="public-layout__footer">
      <div class="public-layout__footer-inner">
        <div class="public-layout__footer-section">
          <h4>For Workers</h4>
          <NuxtLink to="/jobs/public">Find Jobs</NuxtLink>
          <NuxtLink to="/workers/public">Browse Workers</NuxtLink>
        </div>
        <div class="public-layout__footer-section">
          <h4>For Employers</h4>
          <NuxtLink to="/jobs/new">Post a Job</NuxtLink>
          <NuxtLink to="/auth/sign-up">Hire Workers</NuxtLink>
        </div>
        <div class="public-layout__footer-section">
          <h4>Company</h4>
          <NuxtLink to="/about">About Us</NuxtLink>
          <NuxtLink to="/contact">Contact</NuxtLink>
        </div>
        <div class="public-layout__footer-section">
          <h4>Legal</h4>
          <NuxtLink to="/terms">Terms of Service</NuxtLink>
          <NuxtLink to="/privacy">Privacy Policy</NuxtLink>
          <NuxtLink to="/cookies">Cookie Policy</NuxtLink>
        </div>
      </div>
      <div class="public-layout__footer-bottom">
        <p>© {{ new Date().getFullYear() }} HireBeHired. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Public layout for unauthenticated pages
</script>

<style scoped>
.public-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.public-layout__header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.public-layout__header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
}

.public-layout__logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  color: inherit;
}

.public-layout__logo-icon {
  font-size: 32px;
}

.public-layout__logo-name {
  display: block;
  font-weight: 700;
  font-size: var(--text-lg);
  color: var(--color-text);
}

.public-layout__logo-tagline {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.public-layout__nav {
  display: flex;
  gap: var(--space-6);
}

.public-layout__nav-link {
  text-decoration: none;
  color: var(--color-text);
  font-weight: 500;
  font-size: var(--text-sm);
  transition: color 120ms ease;
}

.public-layout__nav-link:hover,
.public-layout__nav-link.router-link-active {
  color: var(--color-primary-600);
}

.public-layout__actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.btn--post {
  padding: 10px 20px;
  border-radius: var(--radius-pill);
}

.public-layout__content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: var(--space-6);
}

.public-layout__footer {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  margin-top: auto;
}

.public-layout__footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-6);
}

.public-layout__footer-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.public-layout__footer-section h4 {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
}

.public-layout__footer-section a {
  text-decoration: none;
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
  transition: color 120ms ease;
}

.public-layout__footer-section a:hover {
  color: var(--color-primary-600);
}

.public-layout__footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.public-layout__footer-bottom p {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-subtle);
}

@media (max-width: 768px) {
  .public-layout__header-inner {
    flex-direction: column;
    align-items: flex-start;
    padding: var(--space-4);
  }

  .public-layout__nav {
    width: 100%;
    flex-direction: column;
    gap: var(--space-3);
  }

  .public-layout__actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .btn--post {
    width: 100%;
  }

  .public-layout__content {
    padding: var(--space-4);
  }

  .public-layout__footer-inner {
    grid-template-columns: 1fr;
    padding: var(--space-6) var(--space-4);
  }
}
</style>
