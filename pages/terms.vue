<template>
  <div class="terms-page">
    <div class="terms-header">
      <h1>Terms of Service</h1>
    </div>

    <div class="terms-container">
      <div class="terms-card">
        <h2>1. Platform Overview</h2>
        <p>
          HireBeHired is a marketplace platform that connects employers and workers.
          We do not act as an employer or contractor.
        </p>
      </div>

      <div class="terms-card">
        <h2>2. User Responsibilities</h2>
        <ul>
          <li>Users must provide accurate information</li>
          <li>Users must comply with UK laws</li>
          <li>No illegal or fraudulent activity is allowed</li>
        </ul>
      </div>

      <div class="terms-card">
        <h2>3. Payments</h2>
        <p>
          All payments must be processed through HireBeHired using our secure payment system.
          Off-platform payments are prohibited.
        </p>
      </div>

      <div class="terms-card">
        <h2>4. Account Suspension</h2>
        <p>
          We reserve the right to suspend accounts involved in fraud, abuse, or policy violations.
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
  title: 'Terms of Service - HireBeHired'
});
</script>

<style scoped>
.terms-page {
  padding-bottom: 40px;
}

.terms-header {
  background: #111;
  color: #fff;
  padding: 40px 20px;
  text-align: center;
  margin-bottom: 30px;
}

.terms-header h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
}

.terms-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.terms-card {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.terms-card h2 {
  margin-top: 0;
  margin-bottom: 14px;
  font-size: 18px;
  font-weight: 700;
  border-left: 4px solid #111;
  padding-left: 12px;
  color: #111;
}

.terms-card p {
  line-height: 1.7;
  font-size: 15px;
  color: #444;
  margin: 0;
}

.terms-card ul {
  padding-left: 24px;
  margin: 0;
}

.terms-card li {
  margin-bottom: 10px;
  font-size: 15px;
  color: #444;
  line-height: 1.6;
}

.terms-card li:last-child {
  margin-bottom: 0;
}

@media (max-width: 600px) {
  .terms-header {
    padding: 28px 16px;
  }

  .terms-header h1 {
    font-size: 24px;
  }

  .terms-container {
    padding: 0 16px;
  }

  .terms-card {
    padding: 18px;
  }

  .terms-card h2 {
    font-size: 16px;
  }

  .terms-card p,
  .terms-card li {
    font-size: 14px;
  }
}
</style>
