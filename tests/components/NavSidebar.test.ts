import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import NavSidebar from '~/components/layout/NavSidebar.vue';

describe('NavSidebar', () => {
  beforeEach(() => {
    (globalThis as any).useRoute = () => ({ path: '/dashboard', params: {}, query: {} });
  });

  const nuxtLinkStub = { template: '<a><slot /></a>' };

  const createWrapper = (props: any = {}) =>
    mount(NavSidebar, {
      props: {
        items: [
          { label: 'Dashboard', to: '/dashboard', icon: 'home' },
          { label: 'Jobs', to: '/jobs', icon: 'briefcase' },
          { label: 'Settings', to: '/settings', icon: 'gear' },
        ],
        logo: { label: 'ChoreShore', subtitle: 'Platform', initials: 'CS' },
        ...props
      },
      global: { stubs: { NuxtLink: nuxtLinkStub } }
    });

  const createWrapperWithItems = (items: any[], extraProps: any = {}) =>
    mount(NavSidebar, {
      props: { items, logo: { label: 'CS', initials: 'CS' }, ...extraProps },
      global: { stubs: { NuxtLink: nuxtLinkStub } }
    });

  it('renders logo with initials and label', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.nav-sidebar__brand-mark').text()).toBe('CS');
    expect(wrapper.find('.nav-sidebar__brand-title').text()).toBe('ChoreShore');
    expect(wrapper.find('.nav-sidebar__brand-subtitle').text()).toBe('Platform');
  });

  it('renders nav items with labels and icons', () => {
    const wrapper = createWrapper();
    const links = wrapper.findAll('.nav-sidebar__link');
    expect(links).toHaveLength(3);
    expect(links[0].text()).toContain('Dashboard');
    expect(links[1].text()).toContain('Jobs');
    expect(links[2].text()).toContain('Settings');
  });

  it('marks active item based on current route', () => {
    const wrapper = createWrapper();
    const links = wrapper.findAll('.nav-sidebar__link');
    expect(links[0].classes()).toContain('is-active');
    expect(links[1].classes()).not.toContain('is-active');
  });

  it('renders badge when item has badge prop', () => {
    const wrapper = createWrapperWithItems([{ label: 'Messages', to: '/messages', badge: 3 }]);
    const badge = wrapper.find('.nav-sidebar__badge');
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toBe('3');
  });

  it('renders footer items when provided', () => {
    const wrapper = createWrapperWithItems(
      [{ label: 'Dashboard', to: '/dashboard' }],
      { footerItems: [{ label: 'Logout', to: '/auth/sign-out' }] }
    );
    expect(wrapper.find('.nav-sidebar__footer').exists()).toBe(true);
    expect(wrapper.find('.nav-sidebar__footer').text()).toContain('Logout');
  });

  it('shows role badge when currentRole is provided', () => {
    const wrapper = createWrapper({ currentRole: 'employer' });
    const badge = wrapper.find('.nav-sidebar__role-badge');
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toContain('Employer');
  });

  it('does not show role badge when currentRole is missing', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.nav-sidebar__role-badge').exists()).toBe(false);
  });

  it('renders external links as anchor tags', () => {
    const wrapper = createWrapperWithItems([{ label: 'Docs', to: 'https://docs.example.com', external: true }]);
    const link = wrapper.find('.nav-sidebar__link');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener noreferrer');
  });
});
