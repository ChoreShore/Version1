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
  min-width: 0;
}

.top-bar__left,
.top-bar__center,
.top-bar__right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.top-bar__center {
  justify-content: center;
}

.top-bar__right {
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .top-bar {
    grid-template-columns: auto 1fr;
    grid-template-areas: 'left actions';
    padding: var(--space-3) var(--space-4);
    min-height: 56px;
  }

  .top-bar__center {
    display: none;
  }

  .top-bar__right {
    grid-area: actions;
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: var(--space-2);
  }

  .top-bar__right > * {
    flex-shrink: 0;
  }
}
</style>
