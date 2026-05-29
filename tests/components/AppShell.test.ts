import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import AppShell from '~/components/layout/AppShell.vue';

describe('AppShell', () => {
  const createWrapper = () =>
    mount(AppShell, {
      slots: {
        sidebar: '<div data-testid="sidebar">Sidebar</div>',
        topbar: '<div data-testid="topbar">Topbar</div>',
        default: '<div data-testid="main">Main Content</div>',
        'bottom-nav': '<div data-testid="bottom-nav">Bottom Nav</div>',
      }
    });

  it('renders all slot content', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('[data-testid="sidebar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="topbar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="main"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="bottom-nav"]').exists()).toBe(true);
  });

  it('toggles sidebar via toggleSidebar', async () => {
    const wrapper = createWrapper();
    const sidebar = wrapper.find('.app-shell__sidebar');

    expect(sidebar.classes()).not.toContain('is-open');

    await (wrapper.vm as any).toggleSidebar();
    await nextTick();
    expect(sidebar.classes()).toContain('is-open');

    await (wrapper.vm as any).toggleSidebar();
    await nextTick();
    expect(sidebar.classes()).not.toContain('is-open');
  });

  it('opens and closes sidebar via exposed methods', async () => {
    const wrapper = createWrapper();
    const sidebar = wrapper.find('.app-shell__sidebar');

    await (wrapper.vm as any).openSidebar();
    await nextTick();
    expect(sidebar.classes()).toContain('is-open');

    await (wrapper.vm as any).closeSidebar();
    await nextTick();
    expect(sidebar.classes()).not.toContain('is-open');
  });

  it('closes sidebar when scrim is clicked', async () => {
    const wrapper = createWrapper();
    await (wrapper.vm as any).openSidebar();
    await nextTick();

    const scrim = wrapper.find('.app-shell__scrim');
    expect(scrim.exists()).toBe(true);

    await scrim.trigger('click');
    await nextTick();
    expect(wrapper.find('.app-shell__sidebar').classes()).not.toContain('is-open');
  });

  it('does not render scrim when sidebar is closed', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.app-shell__scrim').exists()).toBe(false);
  });
});
