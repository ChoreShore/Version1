<template>
  <nav class="nav-sidebar" aria-label="Primary">
    <div class="nav-sidebar__brand" v-if="logo">
      <slot name="logo">
        <NuxtLink to="/" class="nav-sidebar__brand-link">
          <div class="nav-sidebar__brand-mark">{{ logo.initials ?? 'CS' }}</div>
          <div>
            <p class="nav-sidebar__brand-title">{{ logo.label }}</p>
            <p class="nav-sidebar__brand-subtitle" v-if="logo.subtitle">{{ logo.subtitle }}</p>
          </div>
        </NuxtLink>
      </slot>
    </div>

    <ul class="nav-sidebar__list">
      <li v-for="item in items" :key="item.to">
        <component
          :is="item.external ? 'a' : NuxtLink"
          :href="item.external ? item.to : undefined"
          :to="item.external ? undefined : item.to"
          class="nav-sidebar__link"
          :class="{ 'is-active': isActive(item) }"
          :target="item.external ? '_blank' : undefined"
          :rel="item.external ? 'noopener noreferrer' : undefined"
        >
          <span class="nav-sidebar__icon" aria-hidden="true">
            <slot name="icon" :item="item">
              <span v-if="item.icon">{{ item.icon }}</span>
            </slot>
          </span>
          <span class="nav-sidebar__label">{{ item.label }}</span>
          <span class="nav-sidebar__badge" v-if="item.badge">{{ item.badge }}</span>
        </component>
      </li>
    </ul>

    <div class="nav-sidebar__footer" v-if="footerItems?.length">
      <ul>
        <li v-for="item in footerItems" :key="item.to">
          <NuxtLink :to="item.to" class="nav-sidebar__link">
            <span>{{ item.label }}</span>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <slot name="footer" />
  </nav>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components';

type NavItem = {
  label: string;
  to: string;
  icon?: string;
  badge?: string | number;
  external?: boolean;
};

type LogoConfig = {
  label: string;
  subtitle?: string;
  initials?: string;
};

const props = defineProps<{ items: NavItem[]; footerItems?: NavItem[]; logo?: LogoConfig }>();

const route = useRoute();

const isActive = (item: NavItem) => {
  if (item.external) {
    return false;
  }
  const current = route.path;
  if (item.to === '/') {
    return current === '/';
  }
  return current.startsWith(item.to);
};
</script>

<style scoped>
.nav-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  min-height: 100%;
}

.nav-sidebar__brand {
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.nav-sidebar__brand-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  color: inherit;
}

.nav-sidebar__brand-mark {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: var(--color-primary-100);
  color: var(--color-primary-600);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.nav-sidebar__brand-title {
  margin: 0;
  font-size: var(--text-base);
  font-weight: 600;
}

.nav-sidebar__brand-subtitle {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.nav-sidebar__list,
.nav-sidebar__footer ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-sidebar__link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: var(--color-text);
  text-decoration: none;
  font-weight: 500;
  transition: background 120ms ease, color 120ms ease;
}

.nav-sidebar__link:hover,
.nav-sidebar__link.is-active {
  background-color: var(--color-surface-muted);
}

.nav-sidebar__link.is-active {
  color: var(--color-primary-600);
}

.nav-sidebar__icon {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.nav-sidebar__badge {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background-color: var(--color-primary-100);
  color: var(--color-primary-600);
  font-size: var(--text-xs);
  font-weight: 600;
}

.nav-sidebar__footer {
  margin-top: auto;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}
</style>
