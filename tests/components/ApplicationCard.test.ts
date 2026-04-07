import { describe, test, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ApplicationCard from '~/components/applications/ApplicationCard.vue';

const baseApplication = {
  id: 'app-1',
  job_id: 'job-1',
  worker_id: 'worker-1',
  status: 'pending' as const,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  job_title: 'Plumber needed',
  employer_name: 'Acme Ltd',
  worker_name: 'Alice Smith'
};

const stubs = {
  StatusPill: { template: '<span class="status-pill">{{ label }}</span>', props: ['label', 'variant'] },
  InfoBadge: { template: '<span class="info-badge">{{ label }}</span>', props: ['label'] },
  NuxtLink: { template: '<a class="nuxt-link" :href="to"><slot /></a>', props: ['to'] }
};

const createWrapper = (application = {}, perspective?: 'employer' | 'worker') => {
  return mount(ApplicationCard, {
    props: {
      application: { ...baseApplication, ...application },
      ...(perspective !== undefined ? { perspective } : {})
    },
    global: { stubs }
  });
};

// ─── Default rendering ────────────────────────────────────────────────────────

describe('default rendering', () => {
  test('renders the article element', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('article.application-card').exists()).toBe(true);
  });

  test('shows job title from application.job_title', () => {
    const wrapper = createWrapper({ job_title: 'Electrician wanted' });
    expect(wrapper.find('.application-card__subheading').text()).toBe('Electrician wanted');
  });

  test('falls back to "Untitled job" when job_title is absent', () => {
    const wrapper = createWrapper({ job_title: undefined });
    expect(wrapper.find('.application-card__subheading').text()).toBe('Untitled job');
  });

  test('shows proposed rate when present', () => {
    const wrapper = createWrapper({ proposed_rate: 25 });
    expect(wrapper.text()).toContain('25');
  });

  test('shows "Not provided" when proposed_rate is null', () => {
    const wrapper = createWrapper({ proposed_rate: null });
    expect(wrapper.text()).toContain('Not provided');
  });

  test('shows cover letter excerpt when present', () => {
    const wrapper = createWrapper({ cover_letter: 'I am the best candidate for this role.' });
    expect(wrapper.find('.application-card__excerpt').exists()).toBe(true);
    expect(wrapper.find('.application-card__excerpt').text()).toContain('I am the best candidate');
  });

  test('does not render excerpt when cover_letter is absent', () => {
    const wrapper = createWrapper({ cover_letter: null });
    expect(wrapper.find('.application-card__excerpt').exists()).toBe(false);
  });

  test('truncates cover letter to 200 characters', () => {
    const longLetter = 'A'.repeat(300);
    const wrapper = createWrapper({ cover_letter: longLetter });
    const excerpt = wrapper.find('.application-card__excerpt').text();
    expect(excerpt.replace(/['"\u201C\u201D]/g, '').trim().length).toBeLessThanOrEqual(200);
  });
});

// ─── Perspective: employer (default) ─────────────────────────────────────────

describe('employer perspective', () => {
  test('defaults to employer perspective when prop is omitted', () => {
    const wrapper = createWrapper({ worker_name: 'Bob Jones' });
    expect(wrapper.find('.application-card__title').text()).toBe('Bob Jones');
  });

  test('shows worker_name as primary name', () => {
    const wrapper = createWrapper({ worker_name: 'Carol White' }, 'employer');
    expect(wrapper.find('.application-card__title').text()).toBe('Carol White');
  });

  test('falls back to "Applicant" when worker_name is absent', () => {
    const wrapper = createWrapper({ worker_name: undefined }, 'employer');
    expect(wrapper.find('.application-card__title').text()).toBe('Applicant');
  });

  test('message button labels target as "worker"', () => {
    const wrapper = createWrapper({ status: 'accepted' }, 'employer');
    expect(wrapper.find('.nuxt-link').text()).toContain('worker');
  });
});

// ─── Perspective: worker ──────────────────────────────────────────────────────

describe('worker perspective', () => {
  test('shows employer_name as primary name', () => {
    const wrapper = createWrapper({ employer_name: 'Acme Corp' }, 'worker');
    expect(wrapper.find('.application-card__title').text()).toBe('Acme Corp');
  });

  test('falls back to "Employer" when employer_name is absent', () => {
    const wrapper = createWrapper({ employer_name: undefined }, 'worker');
    expect(wrapper.find('.application-card__title').text()).toBe('Employer');
  });

  test('message button labels target as "employer"', () => {
    const wrapper = createWrapper({ status: 'accepted' }, 'worker');
    expect(wrapper.find('.nuxt-link').text()).toContain('employer');
  });
});

// ─── Withdraw button visibility ───────────────────────────────────────────────

describe('withdraw button', () => {
  test('is shown for worker when status is pending', () => {
    const wrapper = createWrapper({ status: 'pending' }, 'worker');
    expect(wrapper.find('.application-card__withdraw-btn').exists()).toBe(true);
  });

  test('is shown for worker when status is accepted', () => {
    const wrapper = createWrapper({ status: 'accepted' }, 'worker');
    expect(wrapper.find('.application-card__withdraw-btn').exists()).toBe(true);
  });

  test('is shown for worker when status is rejected', () => {
    const wrapper = createWrapper({ status: 'rejected' }, 'worker');
    expect(wrapper.find('.application-card__withdraw-btn').exists()).toBe(true);
  });

  test('is hidden for worker when status is already withdrawn', () => {
    const wrapper = createWrapper({ status: 'withdrawn' }, 'worker');
    expect(wrapper.find('.application-card__withdraw-btn').exists()).toBe(false);
  });

  test('is never shown for employer perspective', () => {
    for (const status of ['pending', 'accepted', 'rejected', 'withdrawn'] as const) {
      const wrapper = createWrapper({ status }, 'employer');
      expect(wrapper.find('.application-card__withdraw-btn').exists()).toBe(false);
    }
  });

  test('emits withdraw event with application id when clicked', async () => {
    const onWithdraw = vi.fn();
    const wrapper = mount(ApplicationCard, {
      props: {
        application: { ...baseApplication, status: 'pending' },
        perspective: 'worker',
        onWithdraw
      },
      global: {
        stubs: {
          StatusPill: true,
          InfoBadge: true,
          NuxtLink: { template: '<a><slot /></a>', props: ['to'] }
        }
      }
    });
    await wrapper.find('.application-card__withdraw-btn').trigger('click');
    expect(onWithdraw).toHaveBeenCalledWith('app-1');
  });
});

// ─── Withdrawal reason display ────────────────────────────────────────────────

describe('withdrawal reason', () => {
  test('shows "Found another job" label for employer when reason is found_another_job', () => {
    const wrapper = createWrapper(
      { status: 'withdrawn', withdrawal_reason: 'found_another_job' },
      'employer'
    );
    expect(wrapper.text()).toContain('Found another job');
  });

  test('shows "Personal reasons" label for employer when reason is personal_reasons', () => {
    const wrapper = createWrapper(
      { status: 'withdrawn', withdrawal_reason: 'personal_reasons' },
      'employer'
    );
    expect(wrapper.text()).toContain('Personal reasons');
  });

  test('does not show withdrawal reason row for employer when no reason is set', () => {
    const wrapper = createWrapper(
      { status: 'withdrawn', withdrawal_reason: null },
      'employer'
    );
    const dts = wrapper.findAll('dt').map(dt => dt.text());
    expect(dts).not.toContain('Withdrawal reason');
  });

  test('does not show withdrawal reason row when status is not withdrawn', () => {
    const wrapper = createWrapper(
      { status: 'pending', withdrawal_reason: 'personal_reasons' },
      'employer'
    );
    const dts = wrapper.findAll('dt').map(dt => dt.text());
    expect(dts).not.toContain('Withdrawal reason');
  });

  test('does not show withdrawal reason row for worker perspective', () => {
    const wrapper = createWrapper(
      { status: 'withdrawn', withdrawal_reason: 'found_another_job' },
      'worker'
    );
    const dts = wrapper.findAll('dt').map(dt => dt.text());
    expect(dts).not.toContain('Withdrawal reason');
  });

  test('falls back to raw reason string for an unrecognised reason value', () => {
    const wrapper = createWrapper(
      { status: 'withdrawn', withdrawal_reason: 'custom_reason' },
      'employer'
    );
    expect(wrapper.text()).toContain('custom_reason');
  });
});

// ─── Message button ───────────────────────────────────────────────────────────

describe('message button', () => {
  test('is shown when status is accepted', () => {
    const wrapper = createWrapper({ status: 'accepted' }, 'employer');
    expect(wrapper.find('.nuxt-link').exists()).toBe(true);
  });

  test('links to /messages with the application id', () => {
    const wrapper = createWrapper({ status: 'accepted', id: 'app-42' }, 'employer');
    expect(wrapper.find('.nuxt-link').attributes('href')).toContain('app-42');
  });

  test('is hidden when status is pending', () => {
    const wrapper = createWrapper({ status: 'pending' }, 'employer');
    expect(wrapper.find('.nuxt-link').exists()).toBe(false);
  });

  test('is hidden when status is withdrawn', () => {
    const wrapper = createWrapper({ status: 'withdrawn' }, 'employer');
    expect(wrapper.find('.nuxt-link').exists()).toBe(false);
  });
});

// ─── Availability notes ───────────────────────────────────────────────────────

describe('availability notes', () => {
  test('shows InfoBadge when availability_notes is present', () => {
    const wrapper = createWrapper({ availability_notes: 'Available from Monday' });
    expect(wrapper.find('.info-badge').exists()).toBe(true);
    expect(wrapper.find('.info-badge').text()).toContain('Available from Monday');
  });

  test('does not render InfoBadge when availability_notes is absent', () => {
    const wrapper = createWrapper({ availability_notes: undefined });
    expect(wrapper.find('.info-badge').exists()).toBe(false);
  });
});
