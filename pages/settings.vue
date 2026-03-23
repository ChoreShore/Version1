<template>
  <div class="settings-page">
    <header class="settings-page__header">
      <h1>Account settings</h1>
      <p class="settings-page__subtitle">Manage your account preferences and security</p>
    </header>

    <div class="settings-page__content">
      <section class="settings-section">
        <RoleManagement />
      </section>

      <section class="settings-section">
        <UpdatePasswordForm />
      </section>

      <section class="settings-section settings-section--danger">
        <DeleteAccountForm />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import RoleManagement from '~/components/profile/RoleManagement.vue';
import UpdatePasswordForm from '~/components/profile/UpdatePasswordForm.vue';
import DeleteAccountForm from '~/components/profile/DeleteAccountForm.vue';

const user = useSupabaseUser();
const router = useRouter();

onMounted(() => {
  if (!user.value) {
    router.push('/auth/sign-in');
  }
});
</script>

<style scoped>
.settings-page {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-6);
}

.settings-page__header {
  margin-bottom: var(--space-8);
}

.settings-page__header h1 {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-2xl);
  font-weight: 700;
}

.settings-page__subtitle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-base);
}

.settings-page__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.settings-section {
  width: 100%;
}

.settings-section--danger {
  margin-top: var(--space-4);
}

@media (max-width: 768px) {
  .settings-page {
    padding: var(--space-4);
  }
}
</style>
