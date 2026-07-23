import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref, onErrorCaptured, onMounted, nextTick } from 'vue';
import ErrorBoundary from '~/components/primitives/ErrorBoundary.vue';

const ThrowingChild = defineComponent({
  name: 'ThrowingChild',
  render() {
    throw new Error('Child exploded');
  }
});

const SafeChild = defineComponent({
  name: 'SafeChild',
  render() {
    return h('p', 'safe content');
  }
});

const createWrapper = (props: any = {}) =>
  defineComponent({
    components: { ErrorBoundary, ThrowingChild },
    template: `<ErrorBoundary v-bind="props"><ThrowingChild /></ErrorBoundary>`,
    setup() {
      return { props };
    }
  });

const createSafeWrapper = (props: any = {}) =>
  defineComponent({
    components: { ErrorBoundary, SafeChild },
    template: `<ErrorBoundary v-bind="props"><SafeChild /></ErrorBoundary>`,
    setup() {
      return { props };
    }
  });

describe('ErrorBoundary', () => {
  beforeEach(() => {
    (globalThis as any).onErrorCaptured = onErrorCaptured;
    (globalThis as any).onMounted = onMounted;
  });

  it('renders slot content when no error', () => {
    const Wrapper = createSafeWrapper();
    const wrapper = mount(Wrapper);
    expect(wrapper.text()).toContain('safe content');
    expect(wrapper.find('.error-boundary').exists()).toBe(false);
  });

  it('renders error UI when child throws', async () => {
    const Wrapper = createWrapper();
    const wrapper = mount(Wrapper);
    await nextTick();
    expect(wrapper.find('.error-boundary').exists()).toBe(true);
  });

  it('displays default title and message', async () => {
    const Wrapper = createWrapper();
    const wrapper = mount(Wrapper);
    await nextTick();
    expect(wrapper.find('.error-boundary__title').text()).toBe('Something went wrong');
    expect(wrapper.find('.error-boundary__message').text()).toBe('An unexpected error occurred. Please try again.');
  });

  it('displays custom title and message', async () => {
    const Wrapper = createWrapper({ title: 'Oops', message: 'Something broke' });
    const wrapper = mount(Wrapper);
    await nextTick();
    expect(wrapper.find('.error-boundary__title').text()).toBe('Oops');
    expect(wrapper.find('.error-boundary__message').text()).toBe('Something broke');
  });

  it('does not show error details by default', async () => {
    const Wrapper = createWrapper();
    const wrapper = mount(Wrapper);
    await nextTick();
    expect(wrapper.find('.error-boundary__details').exists()).toBe(false);
  });

  it('shows error details when showDetails is true', async () => {
    const Wrapper = createWrapper({ showDetails: true });
    const wrapper = mount(Wrapper);
    await nextTick();
    expect(wrapper.find('.error-boundary__details').exists()).toBe(true);
  });

  it('shows reset button by default', async () => {
    const Wrapper = createWrapper();
    const wrapper = mount(Wrapper);
    await nextTick();
    expect(wrapper.find('.error-boundary__button--reset').exists()).toBe(true);
  });

  it('hides reset button when showReset is false', async () => {
    const Wrapper = createWrapper({ showReset: false });
    const wrapper = mount(Wrapper);
    await nextTick();
    expect(wrapper.find('.error-boundary__button--reset').exists()).toBe(false);
  });

  it('always shows retry button', async () => {
    const Wrapper = createWrapper();
    const wrapper = mount(Wrapper);
    await nextTick();
    expect(wrapper.find('.error-boundary__button--retry').exists()).toBe(true);
    expect(wrapper.find('.error-boundary__button--retry').text()).toBe('Try again');
  });

  it('emits retry when retry button clicked', async () => {
    const Wrapper = createWrapper();
    const wrapper = mount(Wrapper);
    await nextTick();
    await wrapper.find('.error-boundary__button--retry').trigger('click');
    const eb = wrapper.findComponent(ErrorBoundary);
    expect(eb.emitted('retry')).toBeTruthy();
  });

  it('emits reset when reset button clicked', async () => {
    const Wrapper = createWrapper();
    const wrapper = mount(Wrapper);
    await nextTick();
    await wrapper.find('.error-boundary__button--reset').trigger('click');
    const eb = wrapper.findComponent(ErrorBoundary);
    expect(eb.emitted('reset')).toBeTruthy();
  });

  it('renders slot content again after retry', async () => {
    const Wrapper = createSafeWrapper();
    const wrapper = mount(Wrapper);
    const eb = wrapper.findComponent(ErrorBoundary);
    (eb.vm as any).$.exposed.retry();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.error-boundary').exists()).toBe(false);
    expect(wrapper.text()).toContain('safe content');
  });

  it('emits error event when child throws', async () => {
    const Wrapper = createWrapper();
    const wrapper = mount(Wrapper);
    await nextTick();
    const eb = wrapper.findComponent(ErrorBoundary);
    expect(eb.emitted('error')).toBeTruthy();
  });

  it('calls onError prop when child throws', () => {
    const onError = vi.fn();
    const Wrapper = createWrapper({ onError });
    mount(Wrapper);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.anything(),
      expect.any(String)
    );
  });

  it('exposes reset and retry methods', async () => {
    const Wrapper = createWrapper();
    const wrapper = mount(Wrapper);
    await nextTick();
    const eb = wrapper.findComponent(ErrorBoundary);
    const exposed = (eb.vm as any).$.exposed;
    expect(exposed.reset).toBeDefined();
    expect(exposed.retry).toBeDefined();
  });
});
