import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TopBar from '~/components/layout/TopBar.vue';

describe('TopBar', () => {
  it('renders all three slot areas', () => {
    const wrapper = mount(TopBar, {
      slots: {
        leading: '<span data-testid="leading">Menu</span>',
        center: '<span data-testid="center">Title</span>',
        actions: '<button data-testid="actions">Action</button>',
      }
    });

    expect(wrapper.find('[data-testid="leading"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="center"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="actions"]').exists()).toBe(true);
  });

  it('renders top-bar container with correct layout classes', () => {
    const wrapper = mount(TopBar);
    const bar = wrapper.find('.top-bar');
    expect(bar.exists()).toBe(true);
    expect(bar.find('.top-bar__left').exists()).toBe(true);
    expect(bar.find('.top-bar__center').exists()).toBe(true);
    expect(bar.find('.top-bar__right').exists()).toBe(true);
  });

  it('centers content in center slot', () => {
    const wrapper = mount(TopBar, {
      slots: { center: '<span>Centered</span>' }
    });
    const center = wrapper.find('.top-bar__center');
    expect(center.text()).toBe('Centered');
  });
});
