<template>
  <div class="top-bar">
    <div class="top-bar__left">
      <slot name="leading" />
    </div>
    <div class="top-bar__center">
      <slot name="center" />
    </div>
    <div class="top-bar__right">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.top-bar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--space-4);
  align-items: center;
  padding: var(--space-4) var(--space-6);
  min-height: 72px;
}

.top-bar__left,
.top-bar__center,
.top-bar__right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.top-bar__center {
  justify-content: center;
}

.top-bar__right {
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .top-bar {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'left actions'
      'center center';
    row-gap: var(--space-3);
  }

  .top-bar__left {
    grid-area: left;
  }

  .top-bar__center {
    grid-area: center;
    justify-content: flex-start;
  }

  .top-bar__right {
    grid-area: actions;
  }
}
</style>
