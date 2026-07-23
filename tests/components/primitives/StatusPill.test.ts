import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StatusPill from '~/components/primitives/StatusPill.vue';

describe('StatusPill', () => {
  it('renders label prop content', () => {
    const wrapper = mount(StatusPill, { props: { label: 'Active' } });
    expect(wrapper.text()).toContain('Active');
  });

  it('renders slot content over label', () => {
    const wrapper = mount(StatusPill, {
      props: { label: 'Label' },
      slots: { default: 'Slot Content' }
    });
    expect(wrapper.text()).toContain('Slot Content');
    expect(wrapper.text()).not.toContain('Label');
  });

  it('defaults to neutral variant', () => {
    const wrapper = mount(StatusPill);
    expect(wrapper.classes()).toContain('status-neutral');
  });

  it('applies info variant class', () => {
    const wrapper = mount(StatusPill, { props: { variant: 'info' } });
    expect(wrapper.classes()).toContain('status-info');
  });

  it('applies success variant class', () => {
    const wrapper = mount(StatusPill, { props: { variant: 'success' } });
    expect(wrapper.classes()).toContain('status-success');
  });

  it('applies warning variant class', () => {
    const wrapper = mount(StatusPill, { props: { variant: 'warning' } });
    expect(wrapper.classes()).toContain('status-warning');
  });

  it('applies danger variant class', () => {
    const wrapper = mount(StatusPill, { props: { variant: 'danger' } });
    expect(wrapper.classes()).toContain('status-danger');
  });

  it('has status-pill base class', () => {
    const wrapper = mount(StatusPill);
    expect(wrapper.classes()).toContain('status-pill');
  });
});
