<template>
  <div class="about-page">
    <div class="about-header">
      <h1>About HireBeHired</h1>
    </div>

    <div class="about-container">
      <p class="about-lead">
        Connecting people who need help with people ready to earn.
      </p>

      <div class="about-card">
        <p>
          HireBeHired was created to make local hiring simple,
          safe and affordable.
        </p>
        <p>
          Our mission is to help individuals, families and
          businesses find trusted workers while creating
          flexible earning opportunities.
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
  title: 'About Us - HireBeHired'
});
</script>

<style scoped>
.about-page {
  padding-bottom: var(--space-10);
}

.about-header {
  background: var(--color-dark);
  color: var(--color-white);
  padding: var(--space-10) var(--space-4);
  text-align: center;
  margin-bottom: var(--space-8);
}

.about-header h1 {
  margin: 0;
  font-size: var(--text-3xl);
  font-weight: 700;
}

.about-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.about-card {
  background: var(--color-surface);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.about-lead {
  font-size: var(--text-lg);
  color: var(--color-text-subtle);
  margin: 0 0 var(--space-2);
  line-height: 1.5;
}

.about-card p {
  line-height: 1.7;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-3);
}

.about-card p:last-child {
  margin-bottom: 0;
}

@media (max-width: 600px) {
  .about-header {
    padding: var(--space-8) var(--space-4);
  }

  .about-header h1 {
    font-size: var(--text-2xl);
  }

  .about-container {
    padding: 0 var(--space-4);
  }

  .about-card {
    padding: var(--space-4);
  }

  .about-lead {
    font-size: var(--text-base);
  }

  .about-card p {
    font-size: var(--text-sm);
  }
}
</style>
