<template>
  <div class="app-shell">
    <aside class="app-shell__sidebar" :class="{ 'is-open': isSidebarOpen }">
      <slot name="sidebar" />
    </aside>

    <div class="app-shell__content">
      <header class="app-shell__topbar">
        <slot name="topbar" :toggle-sidebar="toggleSidebar" />
      </header>
      <main class="app-shell__main">
        <slot />
      </main>
      <nav class="app-shell__bottom-nav">
        <slot name="bottom-nav" :is-sidebar-open="isSidebarOpen" @toggle-sidebar="toggleSidebar" />
      </nav>
    </div>

    <div class="app-shell__scrim" v-if="isSidebarOpen" @click="closeSidebar"></div>
  </div>
</template>

<script setup lang="ts">
const isSidebarOpen = ref(false);

const openSidebar = () => {
  isSidebarOpen.value = true;
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
};

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

onMounted(() => {
  const mediaQuery = window.matchMedia('(min-width: 1024px)');
  if (mediaQuery.matches) {
    isSidebarOpen.value = true;
  }
  const handler = (event: MediaQueryListEvent) => {
    isSidebarOpen.value = event.matches;
  };
  mediaQuery.addEventListener('change', handler);
  onBeforeUnmount(() => mediaQuery.removeEventListener('change', handler));
});

defineExpose({ openSidebar, closeSidebar, toggleSidebar });
</script>

<style scoped>
.app-shell {
  position: relative;
  display: flex;
  min-height: 100vh;
  background-color: var(--color-bg);
  overflow-x: hidden;
}

.app-shell__sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  padding: var(--space-6) var(--space-4);
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  transform: translateX(-100%);
  z-index: 50;
}

.app-shell__sidebar.is-open {
  transform: translateX(0);
}

@media (max-width: 1023px) {
  .app-shell__sidebar {
    transition: transform 250ms ease-out;
  }
}

.app-shell__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: 100vh;
  padding-top: 72px;
}

.app-shell__topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  background-color: var(--color-surface-translucent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
}

.app-shell__main {
  padding: var(--space-4);
  min-width: 0;
}

@media (min-width: 768px) {
  .app-shell__main {
    padding: var(--space-6);
  }
}

.app-shell__scrim {
  position: fixed;
  inset: 0;
  background-color: var(--color-overlay);
  z-index: 40;
}

@media (min-width: 1024px) {
  .app-shell {
    padding-left: 280px;
  }

  .app-shell__mobile-toggle {
    display: none;
  }

  .app-shell__sidebar {
    position: fixed;
    transform: none !important;
  }

  .app-shell__content {
    padding-top: 0;
  }

  .app-shell__topbar {
    position: sticky;
  }

  .app-shell__bottom-nav {
    display: none;
  }

  .app-shell__scrim {
    display: none;
  }
}

.app-shell__bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: var(--space-2) var(--space-4);
  z-index: 50;
}

@media (max-width: 1023px) {
  .app-shell__bottom-nav {
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
  
  .app-shell__main {
    padding-bottom: 70px;
  }
}
</style>
