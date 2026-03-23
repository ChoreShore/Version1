<template>
  <AppShell>
    <template #sidebar>
      <NavSidebar :logo="logo" :items="navItems" />
    </template>

    <template #topbar>
      <TopBar>
        <template #leading>
          <RoleSwitcher v-model="currentRole" />
        </template>
        <template #center>
          <p class="topbar__context">{{ pageTitle }}</p>
        </template>
        <template #actions>
          <NuxtLink v-if="currentRole === 'employer'" to="/jobs/new" class="topbar__action">Post a job</NuxtLink>
          <NuxtLink to="/messages" class="topbar__action topbar__action--primary">New message</NuxtLink>
        </template>
      </TopBar>
    </template>

    <div class="layout-content">
      <slot />
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppShell from '~/components/layout/AppShell.vue';
import NavSidebar from '~/components/layout/NavSidebar.vue';
import TopBar from '~/components/layout/TopBar.vue';
import RoleSwitcher from '~/components/layout/RoleSwitcher.vue';
import { useActiveRole } from '~/composables/useActiveRole';

const route = useRoute();
const { role: currentRole } = useActiveRole();

const logo = {
  label: 'ChoreShore',
  subtitle: 'Marketplace',
  initials: 'CS'
};

const navItems = computed(() => {
  const baseItems = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Applications', to: '/applications' },
    { label: 'Messages', to: '/messages' },
    { label: 'Reviews', to: '/reviews' },
    { label: 'Settings', to: '/settings' }
  ];
  
  // Only show Jobs for employers
  if (currentRole.value === 'employer') {
    baseItems.splice(1, 0, { label: 'Jobs', to: '/jobs' });
  }
  
  return baseItems;
});

const titleMap: Record<string, string> = {
  '/dashboard': 'Overview',
  '/jobs': 'Jobs',
  '/applications': 'Applications',
  '/messages': 'Messages',
  '/reviews': 'Reviews',
  '/settings': 'Settings'
};

const pageTitle = computed(() => {
  const path = route.path;
  const exact = titleMap[path as keyof typeof titleMap];
  if (exact) return exact;
  if (path.startsWith('/jobs/')) return 'Job details';
  if (path.startsWith('/applications/')) return 'Application details';
  if (path.startsWith('/messages/')) return 'Conversation';
  return 'Dashboard';
});
</script>

<style scoped>
.layout-content {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.topbar__context {
  margin: 0;
  font-weight: 600;
  color: var(--color-text-muted);
}

.topbar__action {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 8px 14px;
  text-decoration: none;
  color: inherit;
  display: inline-block;
}

.topbar__action:hover {
  background: var(--color-surface-muted);
}

.topbar__action--primary {
  background: var(--color-primary-600);
  color: white;
  border-color: transparent;
}

.topbar__action--primary:hover {
  background: var(--color-primary-700);
}
</style>
