<template>
  <div class="message-bubble" :class="[`variant-${variant}`]">
    <p class="message-bubble__content">{{ message.body }}</p>
    <div class="message-bubble__meta">
      <span>{{ senderLabel }}</span>
      <time>{{ timestamp }}</time>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  message: {
    body: string;
    created_at: string;
    sender_name?: string;
    is_mine?: boolean;
  };
}>();

const variant = computed(() => (props.message.is_mine ? 'outbound' : 'inbound'));
const senderLabel = computed(() => props.message.sender_name ?? (props.message.is_mine ? 'You' : 'Participant'));
const timestamp = computed(() => new Date(props.message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
</script>

<style scoped>
.message-bubble {
  max-width: 70%;
  padding: var(--space-3);
  border-radius: 18px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.variant-outbound {
  margin-left: auto;
  background: var(--color-primary-600);
  color: white;
  border-color: transparent;
}

.variant-inbound {
  margin-right: auto;
}

.message-bubble__content {
  margin: 0;
  white-space: pre-wrap;
}

.message-bubble__meta {
  font-size: var(--text-xs);
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  opacity: 0.8;
}
</style>
