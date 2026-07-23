import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import FormField from '~/components/primitives/form/FormField.vue';
import FormLabel from '~/components/primitives/form/FormLabel.vue';
import FormError from '~/components/primitives/form/FormError.vue';
import FormHint from '~/components/primitives/form/FormHint.vue';
import FormControl from '~/components/primitives/form/FormControl.vue';

function withFormField(slotContent: any, props: Record<string, any> = { id: 'test' }) {
  const TestWrapper = defineComponent({
    components: { FormField, FormLabel, FormError, FormHint, FormControl },
    render() {
      return h(FormField as any, { ...props }, { default: () => slotContent });
    }
  });
  return mount(TestWrapper);
}

describe('FormField', () => {
  it('renders default slot content', () => {
    const wrapper = withFormField(h('input'));
    expect(wrapper.find('input').exists()).toBe(true);
  });

  it('has form-field class', () => {
    const wrapper = withFormField(null);
    expect(wrapper.find('.form-field').exists()).toBe(true);
  });

  it('defaults to state-default', () => {
    const wrapper = withFormField(null);
    expect(wrapper.find('.form-field').classes()).toContain('state-default');
  });

  it('applies state-success when state prop is success', () => {
    const wrapper = withFormField(null, { id: 'test', state: 'success' });
    expect(wrapper.find('.form-field').classes()).toContain('state-success');
  });

  it('applies state-error when state prop is error', () => {
    const wrapper = withFormField(null, { id: 'test', state: 'error' });
    expect(wrapper.find('.form-field').classes()).toContain('state-error');
  });

  it('applies state-error when error prop is set', () => {
    const wrapper = withFormField(null, { id: 'test', error: 'Invalid' });
    expect(wrapper.find('.form-field').classes()).toContain('state-error');
  });

  it('updates state when error prop changes', async () => {
    const wrapper = withFormField(null, { id: 'test' });
    expect(wrapper.find('.form-field').classes()).toContain('state-default');
    await wrapper.setProps({ error: 'Something went wrong' } as any);
    expect(wrapper.find('.form-field').classes()).toContain('state-error');
  });

  it('clears state when error prop is removed', async () => {
    const wrapper = withFormField(null, { id: 'test', error: 'Bad' });
    expect(wrapper.find('.form-field').classes()).toContain('state-error');
    await wrapper.setProps({ error: null } as any);
    expect(wrapper.find('.form-field').classes()).toContain('state-default');
  });
});

describe('FormLabel', () => {
  it('renders label text from slot', () => {
    const wrapper = withFormField(h(FormLabel as any, null, () => 'Email Address'));
    expect(wrapper.text()).toContain('Email Address');
  });

  it('sets for attribute to fieldId', () => {
    const wrapper = withFormField(h(FormLabel as any, null, () => 'Username'), { id: 'username' });
    const label = wrapper.find('label');
    expect(label.exists()).toBe(true);
    expect(label.attributes('for')).toBe('username');
  });

  it('has form-field__label class', () => {
    const wrapper = withFormField(h(FormLabel as any, null, () => 'Test'), { id: 'test' });
    expect(wrapper.find('label').classes()).toContain('form-field__label');
  });
});

describe('FormError', () => {
  it('displays externalError from FormField', () => {
    const wrapper = withFormField(h(FormError as any), { id: 'email', error: 'Email is required' });
    const error = wrapper.find('.form-field__error');
    expect(error.exists()).toBe(true);
    expect(error.text()).toContain('Email is required');
  });

  it('displays slot content over externalError', () => {
    const wrapper = withFormField(
      h(FormError as any, null, () => 'Custom error'),
      { id: 'email', error: 'External error' }
    );
    const error = wrapper.find('.form-field__error');
    expect(error.text()).toContain('Custom error');
    expect(error.text()).not.toContain('External error');
  });

  it('has role="alert" for accessibility', () => {
    const wrapper = withFormField(h(FormError as any), { id: 'email', error: 'Error' });
    expect(wrapper.find('.form-field__error').attributes('role')).toBe('alert');
  });

  it('sets id to fieldId-error', () => {
    const wrapper = withFormField(h(FormError as any), { id: 'email', error: 'Error' });
    expect(wrapper.find('.form-field__error').attributes('id')).toBe('email-error');
  });

  it('does not render when no error and no slot content', () => {
    const wrapper = withFormField(h(FormError as any), { id: 'email' });
    expect(wrapper.find('.form-field__error').exists()).toBe(false);
  });
});

describe('FormHint', () => {
  it('renders hint text from slot', () => {
    const wrapper = withFormField(
      h(FormHint as any, null, () => 'At least 8 characters'),
      { id: 'password' }
    );
    const hint = wrapper.find('.form-field__hint');
    expect(hint.exists()).toBe(true);
    expect(hint.text()).toContain('At least 8 characters');
  });

  it('sets id to fieldId-hint', () => {
    const wrapper = withFormField(
      h(FormHint as any, null, () => 'Hint'),
      { id: 'password' }
    );
    expect(wrapper.find('.form-field__hint').attributes('id')).toBe('password-hint');
  });

  it('has form-field__hint class', () => {
    const wrapper = withFormField(
      h(FormHint as any, null, () => 'Hint'),
      { id: 'test' }
    );
    expect(wrapper.find('.form-field__hint').classes()).toContain('form-field__hint');
  });
});

describe('FormControl', () => {
  it('provides fieldId to slot props', () => {
    const wrapper = withFormField(
      h(FormControl as any, undefined, ({ id, describedBy }: any) => h('input', { id, 'aria-describedby': describedBy })),
      { id: 'email' }
    );
    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    expect(input.attributes('id')).toBe('email');
  });

  it('provides describedBy with error id when error is present', () => {
    const Inner = defineComponent({
      components: { FormHint, FormError, FormControl },
      render() {
        return [
          h(FormHint as any, null, () => 'Hint'),
          h(FormError as any),
          h(FormControl as any, undefined, ({ id, describedBy }: any) => h('input', { id, 'aria-describedby': describedBy }))
        ];
      }
    });
    const wrapper = withFormField(h(Inner), { id: 'email', error: 'Error' });
    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    expect(input.attributes('aria-describedby')).toContain('email-error');
  });

  it('provides undefined describedBy when no hint or error', () => {
    const wrapper = withFormField(
      h(FormControl as any, undefined, ({ id, describedBy }: any) => h('input', { id, 'aria-describedby': describedBy })),
      { id: 'email' }
    );
    const input = wrapper.find('input');
    expect(input.attributes('aria-describedby')).toBeUndefined();
  });
});
