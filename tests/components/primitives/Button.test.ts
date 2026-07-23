import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Button from '~/components/primitives/Button.vue';

describe('Button', () => {
  it('renders slot content', () => {
    const wrapper = mount(Button, { slots: { default: 'Click me' } });
    expect(wrapper.text()).toContain('Click me');
  });

  it('defaults to primary variant and md size', () => {
    const wrapper = mount(Button);
    expect(wrapper.classes()).toContain('btn--primary');
    expect(wrapper.classes()).toContain('btn--md');
  });

  it('applies secondary variant class', () => {
    const wrapper = mount(Button, { props: { variant: 'secondary' } });
    expect(wrapper.classes()).toContain('btn--secondary');
  });

  it('applies ghost variant class', () => {
    const wrapper = mount(Button, { props: { variant: 'ghost' } });
    expect(wrapper.classes()).toContain('btn--ghost');
  });

  it('applies danger variant class', () => {
    const wrapper = mount(Button, { props: { variant: 'danger' } });
    expect(wrapper.classes()).toContain('btn--danger');
  });

  it('applies sm size class', () => {
    const wrapper = mount(Button, { props: { size: 'sm' } });
    expect(wrapper.classes()).toContain('btn--sm');
  });

  it('applies lg size class', () => {
    const wrapper = mount(Button, { props: { size: 'lg' } });
    expect(wrapper.classes()).toContain('btn--lg');
  });

  it('applies full-width class when fullWidth is true', () => {
    const wrapper = mount(Button, { props: { fullWidth: true } });
    expect(wrapper.classes()).toContain('btn--full-width');
  });

  it('does not apply full-width class by default', () => {
    const wrapper = mount(Button);
    expect(wrapper.classes()).not.toContain('btn--full-width');
  });

  it('emits click event when clicked', () => {
    const wrapper = mount(Button);
    wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('does not emit click when disabled', () => {
    const wrapper = mount(Button, { props: { disabled: true } });
    wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('does not emit click when loading', () => {
    const wrapper = mount(Button, { props: { loading: true } });
    wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('sets disabled attribute when disabled', () => {
    const wrapper = mount(Button, { props: { disabled: true } });
    expect(wrapper.attributes('disabled')).toBeDefined();
  });

  it('sets disabled attribute when loading', () => {
    const wrapper = mount(Button, { props: { loading: true } });
    expect(wrapper.attributes('disabled')).toBeDefined();
  });

  it('sets aria-busy when loading', () => {
    const wrapper = mount(Button, { props: { loading: true } });
    expect(wrapper.attributes('aria-busy')).toBe('true');
  });

  it('does not set aria-busy when not loading', () => {
    const wrapper = mount(Button);
    expect(wrapper.attributes('aria-busy')).toBe('false');
  });

  it('renders spinner when loading', () => {
    const wrapper = mount(Button, { props: { loading: true } });
    expect(wrapper.find('.btn__spinner').exists()).toBe(true);
  });

  it('does not render spinner when not loading', () => {
    const wrapper = mount(Button);
    expect(wrapper.find('.btn__spinner').exists()).toBe(false);
  });

  it('defaults to type="button"', () => {
    const wrapper = mount(Button);
    expect(wrapper.attributes('type')).toBe('button');
  });

  it('sets type to submit', () => {
    const wrapper = mount(Button, { props: { type: 'submit' } });
    expect(wrapper.attributes('type')).toBe('submit');
  });

  it('sets type to reset', () => {
    const wrapper = mount(Button, { props: { type: 'reset' } });
    expect(wrapper.attributes('type')).toBe('reset');
  });
});
