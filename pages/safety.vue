<template>
  <div class="safety-page">
    <div class="safety-header">
      <h1>Safety Center</h1>
      <p>Guidance to help employers and workers stay safe when using HireBeHired.</p>
    </div>

    <div class="safety-container">
      <div class="safety-card">
        <h2>Stay Safe</h2>
        <ul>
          <li>Always communicate through HireBeHired messaging.</li>
          <li>Never send money outside the platform.</li>
          <li>Verify job details before accepting work.</li>
          <li>Report suspicious behaviour immediately.</li>
          <li>Meet in safe public locations where appropriate.</li>
        </ul>
        <div class="notice">
          Never share passwords, banking passwords or verification codes with anyone.
        </div>
      </div>

      <div class="safety-card">
        <h2>Trust & Verification</h2>
        <p>
          HireBeHired may provide email, phone and identity verification badges to help users make informed decisions.
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
  title: 'Safety Center - HireBeHired'
});
</script>

<style scoped>
.safety-page {
  padding-bottom: 40px;
}

.safety-header {
  background: #111;
  color: #fff;
  padding: 40px 20px;
  text-align: center;
  margin-bottom: 30px;
}

.safety-header h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
}

.safety-header p {
  margin: 10px 0 0;
  font-size: 16px;
  color: #d1d5db;
  max-width: 700px;
  margin-inline: auto;
}

.safety-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.safety-card {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.safety-card h2 {
  margin-top: 0;
  margin-bottom: 14px;
  font-size: 18px;
  font-weight: 700;
  border-left: 4px solid #111;
  padding-left: 12px;
  color: #111;
}

.safety-card p {
  line-height: 1.7;
  font-size: 15px;
  color: #444;
  margin: 0;
}

.safety-card ul {
  padding-left: 24px;
  margin: 0 0 18px;
}

.safety-card li {
  margin-bottom: 10px;
  font-size: 15px;
  color: #444;
  line-height: 1.6;
}

.safety-card li:last-child {
  margin-bottom: 0;
}

.notice {
  background: #fff8e6;
  border-left: 4px solid orange;
  padding: 14px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: #92400e;
  line-height: 1.5;
}

@media (max-width: 600px) {
  .safety-header {
    padding: 28px 16px;
  }

  .safety-header h1 {
    font-size: 24px;
  }

  .safety-header p {
    font-size: 14px;
  }

  .safety-container {
    padding: 0 16px;
  }

  .safety-card {
    padding: 18px;
  }

  .safety-card h2 {
    font-size: 16px;
  }

  .safety-card p,
  .safety-card li,
  .notice {
    font-size: 14px;
  }
}
</style>
