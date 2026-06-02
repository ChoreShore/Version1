<template>
  <section class="how-it-works-section">
    <h2 class="how-it-works-section__title">How it works</h2>
    <div class="how-it-works-section__steps">
      <div class="step">
        <div class="step__number">1</div>
        <h4 class="step__title">Post or Browse</h4>
        <p class="step__description">Find jobs or post your needs</p>
      </div>
      <div class="step">
        <div class="step__number">2</div>
        <h4 class="step__title">Connect</h4>
        <p class="step__description">Chat and agree on details</p>
      </div>
      <div class="step">
        <div class="step__number">3</div>
        <h4 class="step__title">Get it Done</h4>
        <p class="step__description">Work completed and paid</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// How it works section
</script>

<style scoped>
.how-it-works-section {
  margin-top: var(--space-8);
  text-align: center;
}

.how-it-works-section__title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  margin-bottom: var(--space-6);
}

.how-it-works-section__steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-6);
}

.step {
  text-align: center;
}

.step__number {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary-600);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  margin: 0 auto var(--space-3);
}

.step__title {
  font-family: var(--font-display);
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-base);
}

.step__description {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-subtle);
}

@media (max-width: 768px) {
  .how-it-works-section__steps {
    grid-template-columns: 1fr;
  }
}
</style>
