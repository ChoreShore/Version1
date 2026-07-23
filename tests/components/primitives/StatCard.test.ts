import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StatCard from '~/components/primitives/StatCard.vue';

describe('StatCard', () => {
  it('renders title and value', () => {
    const wrapper = mount(StatCard, {
      props: { title: 'Revenue', value: '$1,200' }
    });
    expect(wrapper.text()).toContain('Revenue');
    expect(wrapper.text()).toContain('$1,200');
  });

  it('renders numeric value', () => {
    const wrapper = mount(StatCard, {
      props: { title: 'Jobs', value: 42 }
    });
    expect(wrapper.text()).toContain('42');
  });

  it('renders description when provided', () => {
    const wrapper = mount(StatCard, {
      props: { title: 'Revenue', value: 100, description: 'Monthly revenue' }
    });
    expect(wrapper.text()).toContain('Monthly revenue');
  });

  it('does not render description element when not provided', () => {
    const wrapper = mount(StatCard, {
      props: { title: 'Revenue', value: 100 }
    });
    expect(wrapper.find('.stat-card__description').exists()).toBe(false);
  });

  it('renders icon when provided', () => {
    const wrapper = mount(StatCard, {
      props: { title: 'Jobs', value: 5, icon: '🎯' }
    });
    expect(wrapper.find('.stat-card__icon').exists()).toBe(true);
    expect(wrapper.find('.stat-card__icon').text()).toContain('🎯');
  });

  it('does not render icon when not provided', () => {
    const wrapper = mount(StatCard, {
      props: { title: 'Jobs', value: 5 }
    });
    expect(wrapper.find('.stat-card__icon').exists()).toBe(false);
  });

  it('uses icon slot when provided', () => {
    const wrapper = mount(StatCard, {
      props: { title: 'Jobs', value: 5, icon: '🎯' },
      slots: { icon: '<span class="custom-icon">★</span>' }
    });
    expect(wrapper.find('.custom-icon').exists()).toBe(true);
    expect(wrapper.find('.stat-card__icon').exists()).toBe(false);
  });

  it('renders trend with up variant', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: 'Revenue',
        value: 100,
        trend: { value: '+15%', label: 'vs last month', variant: 'up' }
      }
    });
    const trend = wrapper.find('.stat-card__trend');
    expect(trend.exists()).toBe(true);
    expect(trend.classes()).toContain('up');
    expect(trend.text()).toContain('+15%');
    expect(trend.text()).toContain('vs last month');
    expect(trend.text()).toContain('▲');
  });

  it('renders trend with down variant', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: 'Revenue',
        value: 100,
        trend: { value: '-5%', variant: 'down' }
      }
    });
    const trend = wrapper.find('.stat-card__trend');
    expect(trend.classes()).toContain('down');
    expect(trend.text()).toContain('▼');
  });

  it('does not apply up/down class when trend variant is not specified', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: 'Revenue',
        value: 100,
        trend: { value: '+10%' }
      }
    });
    const trend = wrapper.find('.stat-card__trend');
    expect(trend.exists()).toBe(true);
    expect(trend.classes()).not.toContain('up');
    expect(trend.classes()).not.toContain('down');
  });

  it('does not render trend when not provided', () => {
    const wrapper = mount(StatCard, {
      props: { title: 'Revenue', value: 100 }
    });
    expect(wrapper.find('.stat-card__trend').exists()).toBe(false);
  });
});
