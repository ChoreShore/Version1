import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import ConversationItem from '~/components/messages/ConversationItem.vue';

const mockUser = ref<any>({ id: 'user-1' });
const mockRoute = {
  params: {},
  query: {}
};

// Mock #imports module at module level
vi.mock('#imports', () => ({
  useSupabaseUser: () => mockUser,
  useRoute: () => mockRoute,
  useRouter: () => ({ push: vi.fn() }),
  definePageMeta: vi.fn()
}));

describe('ConversationItem', () => {
  let wrapper: any;

  const createConversation = (overrides: any = {}) => ({
    id: 'conv-1',
    job_title: 'Test Job',
    other_participant_name: 'John Doe',
    last_message_preview: 'This is a test message',
    last_message_at: '2024-01-15T10:30:00Z',
    unread_count: 0,
    ...overrides
  });

  const createWrapper = (conversation: any, isActive = false) => {
    return mount(ConversationItem, {
      props: {
        conversation,
        isActive
      },
      global: {
        stubs: {
          InfoBadge: true
        }
      }
    });
  };

  describe('rendering', () => {
    it('renders conversation item', () => {
      const conversation = createConversation();
      wrapper = createWrapper(conversation);
      expect(wrapper.find('.conversation-item').exists()).toBe(true);
    });

    it('renders participant name', () => {
      const conversation = createConversation({ other_participant_name: 'Alice Smith' });
      wrapper = createWrapper(conversation);
      expect(wrapper.text()).toContain('Alice Smith');
    });

    it('renders job title', () => {
      const conversation = createConversation({ job_title: 'Cleaning Service' });
      wrapper = createWrapper(conversation);
      expect(wrapper.text()).toContain('Cleaning Service');
    });

    it('renders last message preview', () => {
      const conversation = createConversation({ last_message_preview: 'Hello there!' });
      wrapper = createWrapper(conversation);
      expect(wrapper.text()).toContain('Hello there!');
    });

    it('renders formatted time', () => {
      const conversation = createConversation({ last_message_at: '2024-01-15T10:30:00Z' });
      wrapper = createWrapper(conversation);
      expect(wrapper.text()).toContain('10:30');
    });

    it('renders avatar with initials', () => {
      const conversation = createConversation({ other_participant_name: 'John Doe' });
      wrapper = createWrapper(conversation);
      expect(wrapper.find('.conversation-item__avatar').exists()).toBe(true);
      expect(wrapper.find('.conversation-item__avatar').text()).toBe('JD');
    });

    it('renders "Conversation" as fallback when participant name is missing', () => {
      const conversation = createConversation({ other_participant_name: '' });
      wrapper = createWrapper(conversation);
      expect(wrapper.text()).toContain('Conversation');
    });
  });

  describe('initials calculation', () => {
    it('calculates initials from full name', () => {
      const conversation = createConversation({ other_participant_name: 'Alice Smith' });
      wrapper = createWrapper(conversation);
      expect(wrapper.find('.conversation-item__avatar').text()).toBe('AS');
    });

    it('calculates initials from single name', () => {
      const conversation = createConversation({ other_participant_name: 'Alice' });
      wrapper = createWrapper(conversation);
      expect(wrapper.find('.conversation-item__avatar').text()).toBe('A');
    });

    it('limits initials to 2 characters', () => {
      const conversation = createConversation({ other_participant_name: 'Alice Middle Smith' });
      wrapper = createWrapper(conversation);
      expect(wrapper.find('.conversation-item__avatar').text()).toBe('AM');
    });
  });

  describe('active state', () => {
    it('applies active class when isActive is true', () => {
      const conversation = createConversation();
      wrapper = createWrapper(conversation, true);
      expect(wrapper.find('.conversation-item').classes()).toContain('is-active');
    });

    it('does not apply active class when isActive is false', () => {
      const conversation = createConversation();
      wrapper = createWrapper(conversation, false);
      expect(wrapper.find('.conversation-item').classes()).not.toContain('is-active');
    });
  });

  describe('unread count', () => {
    it('renders InfoBadge when unread_count is greater than 0', () => {
      const conversation = createConversation({ unread_count: 5 });
      wrapper = createWrapper(conversation);
      expect(wrapper.findComponent({ name: 'InfoBadge' }).exists()).toBe(true);
    });

    it('does not render InfoBadge when unread_count is 0', () => {
      const conversation = createConversation({ unread_count: 0 });
      wrapper = createWrapper(conversation);
      expect(wrapper.findComponent({ name: 'InfoBadge' }).exists()).toBe(false);
    });

    it('does not render InfoBadge when unread_count is undefined', () => {
      const conversation = createConversation({ unread_count: undefined });
      wrapper = createWrapper(conversation);
      expect(wrapper.findComponent({ name: 'InfoBadge' }).exists()).toBe(false);
    });

    it('passes correct unread count to InfoBadge', () => {
      const conversation = createConversation({ unread_count: 3 });
      wrapper = createWrapper(conversation);
      const infoBadge = wrapper.findComponent({ name: 'InfoBadge' });
      expect(infoBadge.props('label')).toBe('3');
    });
  });

  describe('click interaction', () => {
    it('emits select event with conversation id when clicked', async () => {
      const conversation = createConversation({ id: 'conv-123' });
      wrapper = createWrapper(conversation);

      await wrapper.find('.conversation-item').trigger('click');

      expect(wrapper.emitted('select')).toBeTruthy();
      expect(wrapper.emitted('select')[0]).toEqual(['conv-123']);
    });
  });

  describe('time formatting', () => {
    it('formats time correctly for morning hours', () => {
      const conversation = createConversation({ last_message_at: '2024-01-15T09:30:00Z' });
      wrapper = createWrapper(conversation);
      expect(wrapper.text()).toContain('9:30 AM');
    });

    it('formats time correctly for afternoon hours', () => {
      const conversation = createConversation({ last_message_at: '2024-01-15T14:45:00Z' });
      wrapper = createWrapper(conversation);
      expect(wrapper.text()).toContain('2:45 PM');
    });

    it('formats time correctly for midnight', () => {
      const conversation = createConversation({ last_message_at: '2024-01-15T00:00:00Z' });
      wrapper = createWrapper(conversation);
      expect(wrapper.text()).toContain('12:00 AM');
    });
  });
});
