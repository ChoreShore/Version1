<template>
  <div class="page-loading-skeleton">
    <div class="page-loading-skeleton__header">
      <div class="skeleton skeleton--title"></div>
      <div class="skeleton skeleton--subtitle"></div>
    </div>
    <div class="page-loading-skeleton__content">
      <div class="skeleton skeleton--card"></div>
      <div class="skeleton skeleton--card"></div>
      <div class="skeleton skeleton--card"></div>
    </div>
  </div>
</template>

<style scoped>
.page-loading-skeleton {
  padding: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
}

.page-loading-skeleton__header {
  margin-bottom: var(--space-6);
}

.page-loading-skeleton__content {
  display: grid;
  gap: var(--space-4);
}

.skeleton {
  background: linear-gradient(90deg, var(--color-hover) 25%, var(--color-surface-muted) 50%, var(--color-hover) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

.skeleton--title {
  height: 32px;
  width: 60%;
  margin-bottom: var(--space-3);
}

.skeleton--subtitle {
  height: 20px;
  width: 40%;
}

.skeleton--card {
  height: 120px;
  width: 100%;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
