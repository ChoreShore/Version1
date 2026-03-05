<template>
  <button class="conversation-item" type="button" @click="$emit('select', conversation.id)">
    <div class="conversation-item__avatar">
      <span>{{ initials }}</span>
    </div>
    <div class="conversation-item__body">
      <div class="conversation-item__row">
        <p class="conversation-item__name">{{ otherParticipant }}</p>
        <time class="conversation-item__time">{{ lastMessageTime }}</time>
      </div>
      <p class="conversation-item__job">{{ conversation.job_title }}</p>
      <p class="conversation-item__snippet">{{ conversation.last_message_preview }}</p>
    </div>
    <InfoBadge v-if="conversation.unread_count" :label="`${conversation.unread_count}`" variant="info" />
  </button>
</template>

<script setup lang="ts">
import InfoBadge from '~/components/primitives/InfoBadge.vue';

defineEmits<{ (e: 'select', id: string): void }>();

const props = defineProps<{
  conversation: {
    id: string;
    job_title: string;
    other_participant_name: string;
    last_message_preview: string;
    last_message_at: string;
    unread_count?: number;
  };
}>();

const otherParticipant = computed(() => props.conversation.other_participant_name || 'Conversation');
const initials = computed(() => otherParticipant.value.split(' ').map((n) => n[0]).join('').slice(0, 2));
const lastMessageTime = computed(() => new Date(props.conversation.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
</script>

<style scoped>
.conversation-item {
  width: 100%;
  border: none;
  background: transparent;
  padding: var(--space-4);
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--space-3);
  text-align: left;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
}

.conversation-item:hover,
.conversation-item:focus-visible {
  box-shadow: var(--shadow-sm);
}

.conversation-item__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary-100);
  color: var(--color-primary-700);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.conversation-item__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.conversation-item__row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.conversation-item__name {
  margin: 0;
  font-weight: 600;
}

.conversation-item__time {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.conversation-item__job {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-subtle);
}

.conversation-item__snippet {
  margin: 0;
  color: var(--color-text-muted);
}
</style>
