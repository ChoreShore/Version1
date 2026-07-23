import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import InfoBadge from '~/components/primitives/InfoBadge.vue';

describe('InfoBadge', () => {
  it('renders label prop content', () => {
    const wrapper = mount(InfoBadge, { props: { label: 'New' } });
    expect(wrapper.text()).toContain('New');
  });

  it('renders slot content over label', () => {
    const wrapper = mount(InfoBadge, {
      props: { label: 'Label' },
      slots: { default: 'Slot' }
    });
    expect(wrapper.text()).toContain('Slot');
    expect(wrapper.text()).not.toContain('Label');
  });

  it('defaults to neutral variant', () => {
    const wrapper = mount(InfoBadge);
    expect(wrapper.classes()).toContain('variant-neutral');
  });

  it('applies success variant class', () => {
    const wrapper = mount(InfoBadge, { props: { variant: 'success' } });
    expect(wrapper.classes()).toContain('variant-success');
  });

  it('applies warning variant class', () => {
    const wrapper = mount(InfoBadge, { props: { variant: 'warning' } });
    expect(wrapper.classes()).toContain('variant-warning');
  });

  it('applies danger variant class', () => {
    const wrapper = mount(InfoBadge, { props: { variant: 'danger' } });
    expect(wrapper.classes()).toContain('variant-danger');
  });

  it('applies info variant class', () => {
    const wrapper = mount(InfoBadge, { props: { variant: 'info' } });
    expect(wrapper.classes()).toContain('variant-info');
  });

  it('has info-badge base class', () => {
    const wrapper = mount(InfoBadge);
    expect(wrapper.classes()).toContain('info-badge');
  });
});
