import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import JobCard from '~/components/jobs/JobCard.vue'

describe('JobCard Component', () => {
  const mockJob = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Senior Frontend Developer',
    description: 'We are looking for an experienced frontend developer to join our team and build amazing user interfaces.',
    category_name: 'Technology',
    category_id: '456e7890-e89b-12d3-a456-426614174000',
    postcode: 'SW1A 0AA',
    budget_type: 'hourly' as const,
    budget_amount: 75,
    deadline: '2024-12-31',
    status: 'open' as const,
    employer_id: '789e0123-e89b-12d3-a456-426614174000',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    application_count: 5
  }

  const createWrapper = (props: any) => {
    return mount(JobCard, {
      props,
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to']
          }
        }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('component rendering', () => {
    test('renders job card with all required sections', () => {
      const wrapper = createWrapper({ job: mockJob })

      expect(wrapper.find('.job-card').exists()).toBe(true)
      expect(wrapper.find('.job-card__header').exists()).toBe(true)
      expect(wrapper.find('.job-card__title').exists()).toBe(true)
      expect(wrapper.find('.job-card__description').exists()).toBe(true)
      expect(wrapper.find('.job-card__meta').exists()).toBe(true)
      expect(wrapper.find('.job-card__footer').exists()).toBe(true)
    })

    test('displays job title with correct link', () => {
      const wrapper = createWrapper({ job: mockJob })

      const titleLink = wrapper.find('.job-card__title a')
      expect(titleLink.exists()).toBe(true)
      expect(titleLink.text()).toBe(mockJob.title)
      expect(titleLink.attributes('href')).toBe(`/jobs/${mockJob.id}`)
    })

    test('displays category name', () => {
      const wrapper = createWrapper({ job: mockJob })

      const category = wrapper.find('.job-card__category')
      expect(category.text()).toBe(mockJob.category_name)
    })

    test('uses General as fallback when category_name is missing', () => {
      const jobWithoutCategory = { ...mockJob, category_name: undefined }
      const wrapper = createWrapper({ job: jobWithoutCategory })

      const category = wrapper.find('.job-card__category')
      expect(category.text()).toBe('General')
    })

    test('truncates description to 180 characters with ellipsis', () => {
      const wrapper = createWrapper({ job: mockJob })

      const description = wrapper.find('.job-card__description')
      const expectedText = mockJob.description.slice(0, 180) + '…'
      expect(description.text()).toBe(expectedText)
    })

    test('displays application count correctly', () => {
      const wrapper = createWrapper({ job: mockJob })

      const infoBadge = wrapper.findComponent({ name: 'InfoBadge' })
      expect(infoBadge.exists()).toBe(true)
      expect(infoBadge.props('label')).toBe('5 applications')
    })

    test('displays 0 applications when application_count is missing', () => {
      const jobWithoutApplications = { ...mockJob, application_count: undefined }
      const wrapper = createWrapper({ job: jobWithoutApplications })

      const infoBadge = wrapper.findComponent({ name: 'InfoBadge' })
      expect(infoBadge.props('label')).toBe('0 applications')
    })
  })

  describe('status display', () => {
    test('displays correct status variant for open status', () => {
      const wrapper = mount(JobCard, {
        props: { job: { ...mockJob, status: 'open' as const } }
      })

      const statusPill = wrapper.findComponent({ name: 'StatusPill' })
      expect(statusPill.props('variant')).toBe('info')
      expect(statusPill.props('label')).toBe('open')
    })

    test('displays correct status variant for completed status', () => {
      const wrapper = mount(JobCard, {
        props: { job: { ...mockJob, status: 'completed' as const } }
      })

      const statusPill = wrapper.findComponent({ name: 'StatusPill' })
      expect(statusPill.props('variant')).toBe('success')
      expect(statusPill.props('label')).toBe('completed')
    })

    test('replaces underscores with spaces in status labels', () => {
      const wrapper = mount(JobCard, {
        props: { job: { ...mockJob, status: 'in_progress' as any } }
      })

      const statusPill = wrapper.findComponent({ name: 'StatusPill' })
      expect(statusPill.props('label')).toBe('in progress')
    })

    test('falls back to neutral variant for unknown status', () => {
      const wrapper = mount(JobCard, {
        props: { job: { ...mockJob, status: 'unknown' as any } }
      })

      const statusPill = wrapper.findComponent({ name: 'StatusPill' })
      expect(statusPill.props('variant')).toBe('neutral')
    })
  })

  describe('budget display', () => {
    test('displays hourly budget correctly', () => {
      const wrapper = mount(JobCard, {
        props: { job: { ...mockJob, budget_type: 'hourly' as const, budget_amount: 75 } }
      })

      const budgetElements = wrapper.findAll('.job-card__meta dd')
      expect(budgetElements[0].text()).toBe('$75/hr')
    })

    test('displays fixed budget with locale formatting', () => {
      const wrapper = mount(JobCard, {
        props: { job: { ...mockJob, budget_type: 'fixed' as const, budget_amount: 50000 } }
      })

      const budgetElements = wrapper.findAll('.job-card__meta dd')
      expect(budgetElements[0].text()).toBe('$50,000')
    })
  })

  describe('deadline and location display', () => {
    test('displays deadline in locale date format', () => {
      const wrapper = mount(JobCard, {
        props: { job: mockJob }
      })

      const metaElements = wrapper.findAll('.job-card__meta dd')
      const expectedDate = new Date(mockJob.deadline).toLocaleDateString()
      expect(metaElements[1].text()).toBe(expectedDate)
    })

    test('displays postcode correctly', () => {
      const wrapper = mount(JobCard, {
        props: { job: mockJob }
      })

      const metaElements = wrapper.findAll('.job-card__meta dd')
      expect(metaElements[2].text()).toBe(mockJob.postcode)
    })
  })

  describe('slot functionality', () => {
    test('renders actions slot content', () => {
      const wrapper = mount(JobCard, {
        props: { job: mockJob },
        slots: {
          actions: '<button class="test-action">Apply Now</button>'
        }
      })

      const actionButton = wrapper.find('.test-action')
      expect(actionButton.exists()).toBe(true)
      expect(actionButton.text()).toBe('Apply Now')
      expect(wrapper.find('.job-card__actions').exists()).toBe(true)
    })

    test('renders empty actions when no slot content provided', () => {
      const wrapper = mount(JobCard, {
        props: { job: mockJob }
      })

      const actionsContainer = wrapper.find('.job-card__actions')
      expect(actionsContainer.exists()).toBe(true)
      expect(actionsContainer.text()).toBe('')
    })
  })

  describe('meta information structure', () => {
    test('displays all meta information labels correctly', () => {
      const wrapper = mount(JobCard, {
        props: { job: mockJob }
      })

      const labels = wrapper.findAll('.job-card__meta dt')
      expect(labels[0].text()).toBe('Budget')
      expect(labels[1].text()).toBe('Deadline')
      expect(labels[2].text()).toBe('Location')
    })
  })

  describe('edge cases', () => {
    test('handles very long description gracefully', () => {
      const longDescription = 'a'.repeat(300)
      const jobWithLongDescription = { ...mockJob, description: longDescription }
      const wrapper = mount(JobCard, {
        props: { job: jobWithLongDescription }
      })

      const description = wrapper.find('.job-card__description')
      expect(description.text().length).toBe(181) // 180 chars + ellipsis
      expect(description.text().endsWith('…')).toBe(true)
    })

    test('handles empty description', () => {
      const jobWithEmptyDescription = { ...mockJob, description: '' }
      const wrapper = mount(JobCard, {
        props: { job: jobWithEmptyDescription }
      })

      const description = wrapper.find('.job-card__description')
      expect(description.text()).toBe('…')
    })

    test('handles zero budget amount', () => {
      const wrapper = mount(JobCard, {
        props: { job: { ...mockJob, budget_amount: 0 } }
      })

      const budgetElements = wrapper.findAll('.job-card__meta dd')
      expect(budgetElements[0].text()).toBe('$0/hr')
    })

    test('handles missing application_count', () => {
      const jobWithoutApplicationCount = { ...mockJob, application_count: undefined }
      const wrapper = mount(JobCard, {
        props: { job: jobWithoutApplicationCount }
      })

      const infoBadge = wrapper.findComponent({ name: 'InfoBadge' })
      expect(infoBadge.props('label')).toBe('0 applications')
    })
  })

  describe('computed properties', () => {
    test('computes budget display correctly for both types', () => {
      // Test hourly
      const hourlyWrapper = mount(JobCard, {
        props: { job: { ...mockJob, budget_type: 'hourly' as const, budget_amount: 50 } }
      })

      const hourlyBudget = hourlyWrapper.findAll('.job-card__meta dd')[0]
      expect(hourlyBudget.text()).toBe('$50/hr')

      // Test fixed
      const fixedWrapper = mount(JobCard, {
        props: { job: { ...mockJob, budget_type: 'fixed' as const, budget_amount: 1000 } }
      })

      const fixedBudget = fixedWrapper.findAll('.job-card__meta dd')[0]
      expect(fixedBudget.text()).toBe('$1,000')
    })

    test('computes status variant correctly for all statuses', () => {
      const statuses = [
        { status: 'open', expected: 'info' },
        { status: 'completed', expected: 'success' },
        { status: 'cancelled', expected: 'neutral' }
      ]

      statuses.forEach(({ status, expected }) => {
        const wrapper = mount(JobCard, {
          props: { job: { ...mockJob, status: status as any } }
        })

        const statusPill = wrapper.findComponent({ name: 'StatusPill' })
        expect(statusPill.props('variant')).toBe(expected)
      })
    })
  })
})
