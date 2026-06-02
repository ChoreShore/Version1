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
  padding-bottom: 40px;
}

.contact-header {
  background: #111;
  color: #fff;
  padding: 40px 20px;
  text-align: center;
  margin-bottom: 30px;
}

.contact-header h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
}

.contact-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.contact-card {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.contact-card h2 {
  margin-top: 0;
  margin-bottom: 14px;
  font-size: 18px;
  font-weight: 700;
  border-left: 4px solid #111;
  padding-left: 12px;
  color: #111;
}

.contact-card p {
  line-height: 1.7;
  font-size: 15px;
  color: #444;
  margin: 0 0 12px;
}

.contact-card ul {
  padding-left: 24px;
  margin: 0;
}

.contact-card li {
  margin-bottom: 10px;
  font-size: 15px;
  color: #444;
  line-height: 1.6;
}

.contact-card li:last-child {
  margin-bottom: 0;
}

@media (max-width: 600px) {
  .contact-header {
    padding: 28px 16px;
  }

  .contact-header h1 {
    font-size: 24px;
  }

  .contact-container {
    padding: 0 16px;
  }

  .contact-card {
    padding: 18px;
  }

  .contact-card h2 {
    font-size: 16px;
  }

  .contact-card p,
  .contact-card li {
    font-size: 14px;
  }
}
</style>
