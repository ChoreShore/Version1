<template>
  <div class="privacy-page">
    <div class="privacy-header">
      <h1>Privacy Policy</h1>
    </div>

    <div class="privacy-container">
      <div class="privacy-card">
        <h2>1. Data We Collect</h2>
        <ul>
          <li>Name, email, phone number</li>
          <li>Postcode (area-level only)</li>
          <li>Account activity and messages</li>
        </ul>
      </div>

      <div class="privacy-card">
        <h2>2. How We Use Data</h2>
        <p>
          We use your data to match jobs, enable payments, improve safety, and prevent fraud.
        </p>
      </div>

      <div class="privacy-card">
        <h2>3. Third Parties</h2>
        <p>
          We use trusted providers such as Stripe (payments) and Didit (identity verification).
        </p>
      </div>

      <div class="privacy-card">
        <h2>4. GDPR Rights</h2>
        <ul>
          <li>Request data deletion</li>
          <li>Request data access</li>
          <li>Withdraw consent</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'public'
});

useHead({
  title: 'Privacy Policy - HireBeHired'
});
</script>

<style scoped>
.privacy-page {
  padding-bottom: 40px;
}

.privacy-header {
  background: #111;
  color: #fff;
  padding: 40px 20px;
  text-align: center;
  margin-bottom: 30px;
}

.privacy-header h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
}

.privacy-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.privacy-card {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.privacy-card h2 {
  margin-top: 0;
  margin-bottom: 14px;
  font-size: 18px;
  font-weight: 700;
  border-left: 4px solid #111;
  padding-left: 12px;
  color: #111;
}

.privacy-card p {
  line-height: 1.7;
  font-size: 15px;
  color: #444;
  margin: 0;
}

.privacy-card ul {
  padding-left: 24px;
  margin: 0;
}

.privacy-card li {
  margin-bottom: 10px;
  font-size: 15px;
  color: #444;
  line-height: 1.6;
}

.privacy-card li:last-child {
  margin-bottom: 0;
}

@media (max-width: 600px) {
  .privacy-header {
    padding: 28px 16px;
  }

  .privacy-header h1 {
    font-size: 24px;
  }

  .privacy-container {
    padding: 0 16px;
  }

  .privacy-card {
    padding: 18px;
  }

  .privacy-card h2 {
    font-size: 16px;
  }

  .privacy-card p,
  .privacy-card li {
    font-size: 14px;
  }
}
</style>
