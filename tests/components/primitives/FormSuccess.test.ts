import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FormSuccess from '~/components/primitives/form/FormSuccess.vue';

describe('FormSuccess', () => {
  it('renders slot content', () => {
    const wrapper = mount(FormSuccess, { slots: { default: 'Saved successfully' } });
    expect(wrapper.text()).toContain('Saved successfully');
  });

  it('has form-field__success class', () => {
    const wrapper = mount(FormSuccess);
    expect(wrapper.classes()).toContain('form-field__success');
  });

  it('renders empty when no slot provided', () => {
    const wrapper = mount(FormSuccess);
    expect(wrapper.text()).toBe('');
  });
});
