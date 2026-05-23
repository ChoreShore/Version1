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
      <div class="nav-sidebar__role-badge" v-if="currentRole">
        <span class="nav-sidebar__role-dot"></span>
        <span class="nav-sidebar__role-label">{{ currentRoleLabel }}</span>
      </div>
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
          :aria-label="item.label"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          <span class="nav-sidebar__icon" aria-hidden="true">
            <slot name="icon" :item="item">
              <span v-if="item.icon">{{ item.icon }}</span>
            </slot>
          </span>
          <span class="nav-sidebar__label">{{ item.label }}</span>
          <span class="nav-sidebar__badge" v-if="item.badge" :aria-label="`${item.badge} notifications`">{{ item.badge }}</span>
        </component>
      </li>
    </ul>

    <div class="nav-sidebar__footer" v-if="footerItems?.length" role="group" aria-label="Footer navigation">
      <ul>
        <li v-for="item in footerItems" :key="item.to">
          <NuxtLink :to="item.to" class="nav-sidebar__link" :aria-label="item.label">
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

const props = defineProps<{ items: NavItem[]; footerItems?: NavItem[]; logo?: LogoConfig; currentRole?: string }>();

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

const currentRoleLabel = computed(() => {
  if (!props.currentRole) return '';
  return props.currentRole.charAt(0).toUpperCase() + props.currentRole.slice(1);
});
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
  border-bottom: 1px solid var(--border);
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
  background: linear-gradient(135deg, var(--teal), var(--accent));
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--text-sm);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.nav-sidebar__brand-title {
  margin: 0;
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-teal);
}

.nav-sidebar__brand-subtitle {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--muted);
  letter-spacing: 0.2px;
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
  color: var(--text);
  text-decoration: none;
  font-weight: 500;
  transition: background 120ms ease, color 120ms ease;
}

.nav-sidebar__link:hover,
.nav-sidebar__link.is-active {
  background-color: var(--color-hover);
}

.nav-sidebar__link.is-active {
  color: var(--color-teal);
}

.nav-sidebar__link:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
  border-radius: var(--radius-md);
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
  background-color: var(--color-mint);
  color: var(--color-teal);
  font-size: var(--text-xs);
  font-weight: 600;
}

.nav-sidebar__footer {
  margin-top: auto;
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.nav-sidebar__role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--color-mint);
  color: var(--color-teal);
  font-size: var(--text-xs);
  font-weight: 600;
  margin-top: var(--space-2);
}

.nav-sidebar__role-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-teal);
}
</style>
