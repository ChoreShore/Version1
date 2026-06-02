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
  padding-bottom: 40px;
}

.about-header {
  background: #111;
  color: #fff;
  padding: 40px 20px;
  text-align: center;
  margin-bottom: 30px;
}

.about-header h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
}

.about-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.about-card {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.about-lead {
  font-size: 18px;
  color: #6b7280;
  margin: 0 0 10px;
  line-height: 1.5;
}

.about-card p {
  line-height: 1.7;
  font-size: 15px;
  color: #444;
  margin: 0 0 14px;
}

.about-card p:last-child {
  margin-bottom: 0;
}

@media (max-width: 600px) {
  .about-header {
    padding: 28px 16px;
  }

  .about-header h1 {
    font-size: 24px;
  }

  .about-container {
    padding: 0 16px;
  }

  .about-card {
    padding: 18px;
  }

  .about-lead {
    font-size: 16px;
  }

  .about-card p {
    font-size: 14px;
  }
}
</style>
