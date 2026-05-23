<template>
  <section class="legal-section">
    <h2 class="legal-section__title">Trust & Legal</h2>
    <p class="legal-section__subtitle">Your safety and security is our priority</p>
    
    <div class="legal-section__grid">
      <div class="legal-card">
        <h4>🔒 Secure Payments</h4>
        <p>Escrow protection ensures funds are only released when work is completed to your satisfaction.</p>
      </div>
      <div class="legal-card">
        <h4>📋 Clear Contracts</h4>
        <p>Standardized agreements protect both workers and employers with clear terms and conditions.</p>
      </div>
      <div class="legal-card">
        <h4>✅ Identity Verification</h4>
        <p>All workers undergo ID verification and Right to Work checks for your peace of mind.</p>
      </div>
      <div class="legal-card">
        <h4>⚖️ Dispute Resolution</h4>
        <p>Fair and transparent dispute handling process to resolve any issues that may arise.</p>
      </div>
    </div>

    <div class="legal-section__footer">
      <NuxtLink to="/terms" class="legal-link">Terms of Service</NuxtLink>
      <span>•</span>
      <NuxtLink to="/privacy" class="legal-link">Privacy Policy</NuxtLink>
      <span>•</span>
      <NuxtLink to="/cookies" class="legal-link">Cookie Policy</NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
// Trust and legal information section
</script>

<style scoped>
.legal-section {
  margin-top: var(--space-8);
  background: var(--color-surface);
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  text-align: center;
}

.legal-section__title {
  font-size: var(--text-2xl);
  margin-bottom: var(--space-2);
}

.legal-section__subtitle {
  color: var(--color-text-subtle);
  margin-bottom: var(--space-6);
  font-size: var(--text-sm);
}

.legal-section__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-5);
  text-align: left;
}

.legal-card {
  background: var(--color-surface-muted);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  transition: transform 0.2s ease, background 0.2s ease;
}

.legal-card:hover {
  transform: translateY(-4px);
  background: var(--color-surface-hover);
}

.legal-card h4 {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-base);
}

.legal-card p {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-subtle);
  line-height: 1.5;
}

.legal-section__footer {
  margin-top: var(--space-6);
  font-size: var(--text-sm);
  color: var(--color-text-subtle);
}

.legal-link {
  color: var(--color-text);
  text-decoration: none;
  margin: 0 var(--space-2);
}

.legal-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .legal-section__grid {
    grid-template-columns: 1fr;
  }
}
</style>
