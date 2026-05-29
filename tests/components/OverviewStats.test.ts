import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import OverviewStats from '~/components/dashboard/OverviewStats.vue';

describe('OverviewStats', () => {
  const createWrapper = (stats: any[]) =>
    mount(OverviewStats, {
      props: { stats },
      global: { stubs: { StatCard: true } }
    });

  it('renders a StatCard for each stat', () => {
    const stats = [
      { title: 'Jobs', value: '5', description: 'Active jobs', icon: 'briefcase' },
      { title: 'Applications', value: '12', description: 'Total apps' },
    ];
    const wrapper = createWrapper(stats);
    const cards = wrapper.findAllComponents({ name: 'StatCard' });
    expect(cards).toHaveLength(2);
  });

  it('passes correct props to StatCard', () => {
    const stats = [
      { title: 'Earnings', value: '£1,200', description: 'This month', icon: 'wallet', trend: { value: '+12%', variant: 'up' as const } },
    ];
    const wrapper = createWrapper(stats);
    const card = wrapper.findComponent({ name: 'StatCard' });
    expect(card.props('title')).toBe('Earnings');
    expect(card.props('value')).toBe('£1,200');
    expect(card.props('description')).toBe('This month');
    expect(card.props('icon')).toBe('wallet');
    expect(card.props('trend')).toEqual({ value: '+12%', variant: 'up' });
  });

  it('renders empty section when no stats provided', () => {
    const wrapper = createWrapper([]);
    expect(wrapper.findComponent({ name: 'StatCard' }).exists()).toBe(false);
  });

  it('renders section with overview-stats class', () => {
    const wrapper = createWrapper([{ title: 'X', value: '1' }]);
    expect(wrapper.find('section.overview-stats').exists()).toBe(true);
  });
});
