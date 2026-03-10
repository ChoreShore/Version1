<template>
  <section class="landing">
    <h1>Redirecting…</h1>
    <p>Lets get you to the right place.</p>
  </section>
</template>

<script setup lang="ts">
import { watchEffect } from 'vue';
import { useSupabaseUser } from '#imports';

const user = useSupabaseUser();

watchEffect(() => {
  if (user.value) {
    navigateTo('/dashboard', { replace: true });
  } else {
    navigateTo('/auth/sign-in', { replace: true });
  }
});
</script>

<style scoped>
.landing {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--space-3);
  text-align: center;
  padding: var(--space-6);
}

.landing p {
  color: var(--color-text-muted);
}
</style>
