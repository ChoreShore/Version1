<template>
  <section class="messages-page">
    <aside class="messages-page__sidebar">
      <div class="messages-page__sidebar-header">
        <h2>Conversations</h2>
        <p>Your recent chats across jobs</p>
      </div>

      <label class="messages-page__search">
        <span class="sr-only">Search conversations</span>
        <input v-model="searchQuery" type="search" placeholder="Search by name or job" />
      </label>

      <div class="messages-page__conversation-list" role="list">
        <template v-if="conversationsLoading">
          <div v-for="n in 4" :key="`conversation-skeleton-${n}`" class="messages-page__conversation-skeleton">
            <LoadingSkeleton variant="block" height="82px" />
          </div>
        </template>

        <template v-else-if="conversationsError">
          <EmptyState title="Could not load conversations" :description="conversationsError" />
        </template>

        <template v-else-if="!filteredConversations.length">
          <EmptyState 
            :title="role === 'employer' ? 'No conversations' : 'No conversations'"
            :description="role === 'employer' ? 'Start messaging applicants to see threads here.' : 'Apply to jobs and message employers to see conversations here.'"
          />
        </template>

        <template v-else>
          <ConversationItem
            v-for="conversation in filteredConversations"
            :key="conversation.id"
            :conversation="formatConversationForItem(conversation)"
            @select="() => selectConversation(conversation.id as string)"
            :class="{ 'is-active': conversation.id === selectedConversationId }"
          />
        </template>
      </div>
    </aside>

    <div class="messages-page__thread">
      <template v-if="!activeConversation">
        <EmptyState
          title="Select a conversation"
          description="Choose a thread on the left to view the full message history."
        />
      </template>

      <template v-else>
        <header class="messages-page__thread-header">
          <div>
            <p class="messages-page__thread-eyebrow">{{ activeConversation.job_title ?? 'Job' }}</p>
            <h1>{{ activeConversation.other_participant_name }}</h1>
          </div>
          <NuxtLink :to="`/jobs/${activeConversation.job_id}`" class="messages-page__thread-link">
            View job
          </NuxtLink>
        </header>

        <div class="messages-page__thread-body">
          <template v-if="messagesLoading">
            <div v-for="n in 4" :key="`thread-skeleton-${n}`" class="messages-page__message-skeleton">
              <LoadingSkeleton variant="block" height="72px" />
            </div>
          </template>

          <template v-else-if="messagesError">
            <EmptyState title="Unable to load messages" :description="messagesError" />
          </template>

          <template v-else-if="!threadMessages.length">
            <EmptyState 
            :title="role === 'employer' ? 'No messages yet' : 'No messages yet'"
            :description="role === 'employer' ? 'Send the first message to start this conversation.' : 'Send a message to begin this conversation.'"
          />
          </template>

          <div v-else class="messages-page__messages" role="log" aria-live="polite">
            <MessageBubble v-for="message in threadMessages" :key="message.id" :message="message" />
          </div>
        </div>

        <form class="messages-page__composer" @submit.prevent="handleSend">
          <FormField id="message-composer">
            <FormLabel>Message</FormLabel>
            <FormControl>
              <textarea
                v-model="composer"
                rows="3"
                placeholder="Write your update"
                :disabled="sending"
              ></textarea>
            </FormControl>
            <FormHint>Shift + Enter for a new line</FormHint>
          </FormField>
          <button type="submit" :disabled="sending || !composer.trim()" class="messages-page__send">
            {{ sending ? 'Sending...' : 'Send message' }}
          </button>
        </form>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
});
import { computed, onMounted, ref, watch } from 'vue';
import { useSupabaseUser } from '#imports';
import ConversationItem from '~/components/messages/ConversationItem.vue';
import MessageBubble from '~/components/messages/MessageBubble.vue';
import EmptyState from '~/components/primitives/EmptyState.vue';
import LoadingSkeleton from '~/components/primitives/LoadingSkeleton.vue';
import FormField from '~/components/primitives/form/FormField.vue';
import FormLabel from '~/components/primitives/form/FormLabel.vue';
import FormControl from '~/components/primitives/form/FormControl.vue';
import FormHint from '~/components/primitives/form/FormHint.vue';
import { useMessages } from '~/composables/useMessages';
import { useActiveRole } from '~/composables/useActiveRole';
import type { ConversationSummary, MessageWithProfiles } from '~/schemas/message';

const messagesApi = useMessages();
const user = useSupabaseUser();
const { role } = useActiveRole();
const route = useRoute();

const conversations = ref<ConversationSummary[]>([]);
const conversationsLoading = ref(true);
const conversationsError = ref<string | null>(null);
const selectedConversationId = ref<string | null>(null);
const searchQuery = ref('');
const newConversationApplication = ref<any>(null);

const thread = ref<MessageWithProfiles[]>([]);
const messagesLoading = ref(false);
const messagesError = ref<string | null>(null);
const composer = ref('');
const sending = ref(false);

const normalizeConversation = (conversation: any): ConversationSummary => {
  const fullName =
    conversation.other_participant_name ||
    [conversation.other_user_first_name, conversation.other_user_last_name].filter(Boolean).join(' ').trim();

  return {
    ...conversation,
    id: conversation.id ?? `${conversation.job_id}-${conversation.other_user_id ?? crypto.randomUUID?.() ?? Date.now()}`,
    job_title: conversation.job_title ?? 'Untitled job',
    other_participant_name: fullName || 'Participant',
    last_message_preview:
      conversation.last_message_preview || conversation.last_message_content || 'No messages yet',
    last_message_at: conversation.last_message_at || conversation.last_message_sent_at || new Date().toISOString()
  };
};

const fetchConversations = async () => {
  conversationsLoading.value = true;
  conversationsError.value = null;
  try {
    const response = await messagesApi.listConversations(role.value);
    const normalized = (response.conversations ?? []).map((conv: any) => normalizeConversation(conv));
    conversations.value = normalized;
    
    // Check if application query param is present
    const applicationId = route.query.application as string;
    if (applicationId) {
      // Try to find existing conversation for this application
      const existingConv = normalized.find((conv: any) => conv.application_id === applicationId || conv.id === applicationId);
      if (existingConv) {
        selectedConversationId.value = existingConv.id ?? null;
      } else {
        // Fetch application details to enable first message
        await fetchApplicationForNewConversation(applicationId);
      }
    } else if (!selectedConversationId.value && normalized.length) {
      selectedConversationId.value = normalized[0].id ?? null;
    }
  } catch (err: any) {
    conversationsError.value = err?.data?.statusMessage || 'We were not able to fetch conversations.';
  } finally {
    conversationsLoading.value = false;
  }
};
 {
constst existing = con fetchApplicationForNewConversation = async (applicationId: string) => {;
  if (existing) return existing;
  
  // If no existing conversation but we have a new application, create a temporary conversation object
  if (newConversationApplication.value && selectedConversationId.value === newConversationApplication.value.id) {
    const app = newConversationApplication.value;
    const isEmployer = role.value === 'employer';
    return {
      id: app.id,
     job_id: app.job_id,
      job_title: app.job_title 'Job',
      applicatio_id: app.id,
      other_ser_id: isEmpoyer ? app.worker_id : app.job?.empoyer_id,
      other_participant_name: isEmployer ? app.worker_name : app.employer_name,
      last_message_preview: 'Start a conversation',
      last_message_at: new Date().toISOString(),
      unread_count: 0
    };
  }
  
  return null;
}  try {
    const response = await $fetch(`/api/applications/${applicationId}`);
    if (response.application) {
      newConversationApplication.value = response.application;
      selectedConversationId.value = applicationId;
    }
  } catch (err) {
    console.error('Failed to fetch application:', err);
  }
};

const filteredConversations = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return conversations.value;
  return conversations.value.filter((conversation) => {
    return (
      conversation.job_title?.toLowerCase().includes(query) ||
      conversation.other_participant_name?.toLowerCase().includes(query)
    );
  });
});

const activeConversation = computed(() =>
  conversations.value.find((conversation) => conversation.id === selectedConversationId.value) || null
);

const formatConversationForItem = (conversation: ConversationSummary) => ({
  id: conversation.id ?? conversation.job_id,
  job_title: conversation.job_title ?? 'Untitled job',
  other_participant_name: conversation.other_participant_name ?? 'Participant',
  last_message_preview: conversation.last_message_preview ?? 'No messages yet',
  last_message_at: conversation.last_message_at ?? new Date().toISOString(),
  unread_count: conversation.unread_count ?? 0
});

const loadMessages = async (conversation: ConversationSummary) => {
  if (!conversation?.job_id) return;
  messagesLoading.value = true;
  messagesError.value = null;
  try {
    const response = await messagesApi.getJobMessages(conversation.job_id);
    thread.value = response.messages ?? [];
  } catch (err: any) {
    messagesError.value = err?.data?.statusMessage || 'Unable to load this thread.';
  } finally {
    messagesLoading.value = false;
  }
};

watch(selectedConversationId, (newId) => {
  if (!newId) return;
  const conversation = conversations.value.find((item) => item.id === newId);
  if (conversation) {
    loadMessages(conversation);
  }
});

const threadMessages = computed(() => {
  const currentUserId = user.value?.id;
  return thread.value.map((message) => {
    const senderName = [message.sender?.first_name, message.sender?.last_name].filter(Boolean).join(' ').trim();
    return {
      id: message.id,
      body: message.body,
      created_at: message.created_at ?? message.sent_at,
      sender_name: senderName || (message.sender_id === currentUserId ? 'You' : 'Participant'),
      is_mine: message.sender_id === currentUserId
    };
  });
});

const selectConversation = (conversationId: string) => {
  selectedConversationId.value = conversationId;
};

const handleSend = async () => {
  if (!activeConversation.value || !composer.value.trim() || sending.value) return;

  const receiverId =
    activeConversation.value.other_participant_id ||
    activeConversation.value.other_user_id ||
    activeConversation.value.other_participant_name ||
    null;

  if (!receiverId || !activeConversation.value.application_id) {
    messagesError.value = 'Cannot determine conversation participants.';
    return;
  }

  sending.value = true;
  messagesError.value = null;

  try {
    const response = await messagesApi.sendMessage({
      job_id: activeConversation.value.job_id,
      application_id: activeConversation.value.application_id,
      receiver_id: receiverId as string,
      body: composer.value.trim()
    });

    if (response.message) {
      thread.value = [...thread.value, response.message];
      composer.value = '';
    }
  } catch (err: any) {
    messagesError.value = err?.data?.statusMessage || 'Unable to send message.';
  } finally {
    sending.value = false;
  }
};

watch(role, () => {
  fetchConversations();
});

onMounted(() => {
  fetchConversations();
});
</script>

<style scoped>
.messages-page {
  display: grid;
  grid-template-columns: minmax(280px, 360px) 1fr;
  gap: var(--space-5);
  min-height: calc(100vh - 180px);
}

.messages-page__sidebar {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.messages-page__sidebar-header h2 {
  margin: 0;
}

.messages-page__sidebar-header p {
  margin: 0;
  color: var(--color-text-subtle);
}

.messages-page__search input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 10px 14px;
}

.messages-page__conversation-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.messages-page__thread {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.messages-page__thread-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.messages-page__thread-eyebrow {
  margin: 0;
  text-transform: uppercase;
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  color: var(--color-text-subtle);
}

.messages-page__thread-link {
  text-decoration: none;
  color: var(--color-primary-600);
  font-weight: 600;
}

.messages-page__thread-body {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  min-height: 320px;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--color-surface-2, var(--color-surface));
}

.messages-page__messages {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.messages-page__composer {
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.messages-page__composer textarea {
  width: 100%;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  padding: var(--space-3);
  resize: vertical;
}

.messages-page__send {
  align-self: flex-end;
  border: none;
  background: var(--color-primary-600);
  color: white;
  border-radius: var(--radius-lg);
  padding: 10px 18px;
  font-weight: 600;
}

.messages-page__send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .messages-page {
    grid-template-columns: 1fr;
  }
}
</style>
