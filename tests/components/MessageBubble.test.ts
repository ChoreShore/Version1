import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MessageBubble from '~/components/messages/MessageBubble.vue';

const createWrapper = (message: any) => {
  return mount(MessageBubble, {
    props: { message }
  });
};

// ─── Safe date formatter ───────────────────────────────────────────────────────

describe('safe date formatter', () => {
  test('renders timestamp when created_at is a valid ISO string', () => {
    const message = {
      body: 'Hello there',
      created_at: '2025-01-15T10:30:00Z',
      sender_name: 'John Doe',
      is_mine: false
    };
    const wrapper = createWrapper(message);
    const time = wrapper.find('time');
    expect(time.exists()).toBe(true);
    expect(time.text()).toMatch(/\d{1,2}:\d{2}/); // Should contain time like "10:30"
  });

  test('renders empty string when created_at is undefined', () => {
    const message = {
      body: 'Hello there',
      created_at: undefined,
      sender_name: 'John Doe',
      is_mine: false
    };
    const wrapper = createWrapper(message);
    const time = wrapper.find('time');
    expect(time.exists()).toBe(true);
    expect(time.text()).toBe('');
  });

  test('renders Invalid time when created_at is an invalid date string', () => {
    const message = {
      body: 'Hello there',
      created_at: 'invalid-date',
      sender_name: 'John Doe',
      is_mine: false
    };
    const wrapper = createWrapper(message);
    const time = wrapper.find('time');
    expect(time.exists()).toBe(true);
    expect(time.text()).toBe('Invalid time');
  });

  test('renders empty string when created_at is null', () => {
    const message = {
      body: 'Hello there',
      created_at: null,
      sender_name: 'John Doe',
      is_mine: false
    };
    const wrapper = createWrapper(message);
    const time = wrapper.find('time');
    expect(time.exists()).toBe(true);
    expect(time.text()).toBe('');
  });
});

// ─── Message content ───────────────────────────────────────────────────────────

describe('message content', () => {
  test('renders message body', () => {
    const message = {
      body: 'Hello there',
      created_at: '2025-01-15T10:30:00Z',
      sender_name: 'John Doe',
      is_mine: false
    };
    const wrapper = createWrapper(message);
    expect(wrapper.find('.message-bubble__content').text()).toBe('Hello there');
  });

  test('renders multiline messages correctly', () => {
    const message = {
      body: 'Line 1\nLine 2\nLine 3',
      created_at: '2025-01-15T10:30:00Z',
      sender_name: 'John Doe',
      is_mine: false
    };
    const wrapper = createWrapper(message);
    expect(wrapper.find('.message-bubble__content').text()).toBe('Line 1\nLine 2\nLine 3');
  });
});

// ─── Sender label ─────────────────────────────────────────────────────────────

describe('sender label', () => {
  test('shows sender_name when provided', () => {
    const message = {
      body: 'Hello',
      created_at: '2025-01-15T10:30:00Z',
      sender_name: 'John Doe',
      is_mine: false
    };
    const wrapper = createWrapper(message);
    expect(wrapper.text()).toContain('John Doe');
  });

  test('shows "You" when is_mine is true and sender_name is not provided', () => {
    const message = {
      body: 'Hello',
      created_at: '2025-01-15T10:30:00Z',
      is_mine: true
    };
    const wrapper = createWrapper(message);
    expect(wrapper.text()).toContain('You');
  });

  test('shows "Participant" when is_mine is false and sender_name is not provided', () => {
    const message = {
      body: 'Hello',
      created_at: '2025-01-15T10:30:00Z',
      is_mine: false
    };
    const wrapper = createWrapper(message);
    expect(wrapper.text()).toContain('Participant');
  });
});

// ─── Variant styling ───────────────────────────────────────────────────────────

describe('variant styling', () => {
  test('applies variant-outbound class when is_mine is true', () => {
    const message = {
      body: 'Hello',
      created_at: '2025-01-15T10:30:00Z',
      is_mine: true
    };
    const wrapper = createWrapper(message);
    expect(wrapper.find('.variant-outbound').exists()).toBe(true);
    expect(wrapper.find('.variant-inbound').exists()).toBe(false);
  });

  test('applies variant-inbound class when is_mine is false', () => {
    const message = {
      body: 'Hello',
      created_at: '2025-01-15T10:30:00Z',
      is_mine: false
    };
    const wrapper = createWrapper(message);
    expect(wrapper.find('.variant-inbound').exists()).toBe(true);
    expect(wrapper.find('.variant-outbound').exists()).toBe(false);
  });
});
