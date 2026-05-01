<template>
  <div class="identity-overlay" role="dialog" aria-modal="true" aria-labelledby="identity-title">
    <div class="identity-modal">
      <header class="identity-modal__header">
        <button class="identity-modal__close" type="button" aria-label="Close" @click="emit('close')">&#x2715;</button>
        <div class="identity-modal__icon">&#x1F9F5;</div>
        <h2 id="identity-title" class="identity-modal__title">Verify your identity</h2>
        <p class="identity-modal__subtitle">
          Complete a quick identity check to increase trust with employers. This is powered by Didit.
        </p>
      </header>

      <div v-if="state === 'success'" class="identity-modal__success">
        <p class="identity-modal__success-icon">&#x2705;</p>
        <h3>Identity verified</h3>
        <p>Your identity has been successfully confirmed.</p>
        <button class="identity-modal__submit" @click="emit('verified')">Continue</button>
      </div>

      <div v-else-if="state === 'declined'" class="identity-modal__error">
        <p class="identity-modal__error-icon">&#x26D4;</p>
        <h3>Verification declined</h3>
        <p>Your identity verification was not approved. You can retry from your settings.</p>
        <button class="identity-modal__submit" @click="emit('close')">Close</button>
      </div>

      <div v-else-if="state === 'error'" class="identity-modal__error">
        <p class="identity-modal__error-icon">&#x26A0;&#xFE0F;</p>
        <h3>Something went wrong</h3>
        <p>{{ lastError || 'Please try again later.' }}</p>
        <button class="identity-modal__submit" @click="reset(); state = 'idle'">Try again</button>
      </div>

      <div v-else class="identity-modal__form">
        <button
          class="identity-modal__submit"
          :disabled="isLoading"
          @click="handleStart"
        >
          {{ isLoading ? 'Loading...' : 'Start Identity Verification' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useIdentity } from '~/composables/useIdentity';

const emit = defineEmits<{ (e: 'verified'): void; (e: 'close'): void }>();

const { identityStatus, isLoading, lastError, startVerification, reset } = useIdentity();

type ModalState = 'idle' | 'success' | 'declined' | 'error';
const state = ref<ModalState>('idle');

const handleStart = async () => {
  try {
    await startVerification();
  } catch {
    state.value = 'error';
  }
};

onMounted(() => {
  reset();
});

watch(identityStatus, (newStatus) => {
  if (newStatus === 'verified') {
    state.value = 'success';
  } else if (newStatus === 'declined') {
    state.value = 'declined';
  }
});
</script>

<style scoped>
.identity-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}

.identity-modal {
  background: var(--color-surface);
  border-radius: var(--radius-xl, 16px);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-xl, 0 20px 60px rgba(0,0,0,0.2));
  width: 100%;
  max-width: 520px;
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.identity-modal__header {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  text-align: center;
}

.identity-modal__close {
  position: absolute;
  top: 0;
  right: 0;
  background: none;
  border: none;
  font-size: 1.25rem;
  line-height: 1;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  transition: color 150ms ease, background 150ms ease;
}

.identity-modal__close:hover {
  color: var(--color-text);
  background: var(--color-surface-2);
}

.identity-modal__icon {
  font-size: 2.5rem;
  line-height: 1;
}

.identity-modal__title {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 700;
}

.identity-modal__subtitle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.identity-modal__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: center;
}

.identity-modal__submit {
  padding: var(--space-3) var(--space-4);
  background: var(--color-primary-600);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background 150ms ease;
  width: 100%;
}

.identity-modal__submit:hover:not(:disabled) {
  background: var(--color-primary-700);
}

.identity-modal__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.identity-modal__success,
.identity-modal__error {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
}

.identity-modal__success {
  background: var(--color-success-light);
  border: 1px solid var(--color-success);
}

.identity-modal__error {
  background: var(--color-danger-light);
  border: 1px solid var(--color-danger);
}

.identity-modal__success-icon,
.identity-modal__error-icon {
  margin: 0;
  font-size: 2rem;
}

.identity-modal__success h3 {
  margin: 0;
  color: var(--color-success);
}

.identity-modal__error h3 {
  margin: 0;
  color: var(--color-danger);
}

.identity-modal__success p,
.identity-modal__error p {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

@media (max-width: 480px) {
  .identity-modal {
    padding: var(--space-5);
  }
}
</style>
