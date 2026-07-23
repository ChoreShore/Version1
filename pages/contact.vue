<template>
  <div class="contact-page">
    <div class="contact-header">
      <h1>Contact Us</h1>
    </div>

    <div class="contact-container">
      <div class="contact-card">
        <h2>Get in Touch</h2>
        <p>
          Need help or have a question? Reach out to us and we will get back to you as soon as possible.
        </p>
        <ul>
          <li>Email: support@hirebehired.com</li>
          <li>Response time: within 48 hours</li>
        </ul>
      </div>

      <div class="contact-card">
        <h2>Report an Issue</h2>
        <p>
          If you experience fraud, abuse, or a technical problem, please contact our support team immediately.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'public'
});

useHead({
  title: 'Contact Us - HireBeHired'
});
</script>

<style scoped>
.contact-page {
  padding-bottom: var(--space-10);
}

.contact-header {
  background: var(--color-dark);
  color: var(--color-white);
  padding: var(--space-10) var(--space-4);
  text-align: center;
  margin-bottom: var(--space-8);
}

.contact-header h1 {
  margin: 0;
  font-size: var(--text-3xl);
  font-weight: 700;
}

.contact-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.contact-card {
  background: var(--color-surface);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.contact-card h2 {
  margin-top: 0;
  margin-bottom: var(--space-3);
  font-size: var(--text-lg);
  font-weight: 700;
  border-left: var(--space-1) solid var(--color-dark);
  padding-left: var(--space-3);
  color: var(--color-text);
}

.contact-card p {
  line-height: 1.7;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-3);
}

.contact-card ul {
  padding-left: var(--space-6);
  margin: 0;
}

.contact-card li {
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
}

.contact-card li:last-child {
  margin-bottom: 0;
}

@media (max-width: 600px) {
  .contact-header {
    padding: var(--space-8) var(--space-4);
  }

  .contact-header h1 {
    font-size: var(--text-2xl);
  }

  .contact-container {
    padding: 0 var(--space-4);
  }

  .contact-card {
    padding: var(--space-4);
  }

  .contact-card h2 {
    font-size: var(--text-base);
  }

  .contact-card p,
  .contact-card li {
    font-size: var(--text-sm);
  }
}
</style>
