<template>
  <nav class="bottom-nav">
    <NuxtLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="bottom-nav__item"
      :class="{ 'is-active': isActive(item.to) }"
    >
      <span class="bottom-nav__icon">{{ item.icon }}</span>
      <span class="bottom-nav__label">{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useActiveRole } from '#imports';

const route = useRoute();
const { role } = useActiveRole();

interface NavItem {
  to: string;
  icon: string;
  label: string;
}

const navItems = computed<NavItem[]>(() => {
  const items: NavItem[] = [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/jobs', icon: '📋', label: 'Jobs' },
    { to: '/applications', icon: '📝', label: 'Applications' },
    { to: '/messages', icon: '💬', label: 'Messages' }
  ];
  return items;
});

const isActive = (to: string) => {
  const current = route.path;
  if (to === '/') {
    return current === '/';
  }
  return current.startsWith(to);
};
</script>

<style scoped>
.bottom-nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  height: 60px;
}

.bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  text-decoration: none;
  color: var(--color-text-muted);
  border-radius: var(--radius-md);
  transition: all 150ms ease;
  min-width: 60px;
}

.bottom-nav__item:hover {
  background: var(--hover);
  color: var(--color-text);
}

.bottom-nav__item.is-active {
  color: var(--color-primary-600);
}

.bottom-nav__icon {
  font-size: 20px;
  line-height: 1;
}

.bottom-nav__label {
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
}
</style>
