import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import WithdrawModal from '~/components/applications/WithdrawModal.vue'

describe('WithdrawModal', () => {
  let onConfirm: ReturnType<typeof vi.fn>
  let onCancel: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onConfirm = vi.fn()
    onCancel = vi.fn()
    vi.clearAllMocks()
  })

  const createWrapper = (props: { requiresReason: boolean }) => {
    return mount(WithdrawModal, {
      props: {
        ...props,
        onConfirm,
        onCancel
      }
    })
  }

  describe('rendering — no reason required', () => {
    test('shows the modal title', () => {
      const wrapper = createWrapper({ requiresReason: false })
      expect(wrapper.find('h3').text()).toBe('Withdraw application')
    })

    test('shows simple confirmation message', () => {
      const wrapper = createWrapper({ requiresReason: false })
      expect(wrapper.find('.withdraw-modal__notice').text()).toBe(
        'Are you sure you want to withdraw this application?'
      )
    })

    test('does not render reason fieldset', () => {
      const wrapper = createWrapper({ requiresReason: false })
      expect(wrapper.find('.withdraw-modal__fieldset').exists()).toBe(false)
      expect(wrapper.findAll('input[type="radio"]')).toHaveLength(0)
    })

    test('confirm button is enabled without selecting a reason', () => {
      const wrapper = createWrapper({ requiresReason: false })
      const confirmBtn = wrapper.find('.withdraw-modal__btn--confirm')
      expect(confirmBtn.attributes('disabled')).toBeUndefined()
    })

    test('renders Cancel and Confirm buttons', () => {
      const wrapper = createWrapper({ requiresReason: false })
      expect(wrapper.find('.withdraw-modal__btn--cancel').text()).toBe('Cancel')
      expect(wrapper.find('.withdraw-modal__btn--confirm').text()).toBe('Confirm withdrawal')
    })
  })

  describe('rendering — reason required', () => {
    test('shows accepted-application notice', () => {
      const wrapper = createWrapper({ requiresReason: true })
      expect(wrapper.find('.withdraw-modal__notice').text()).toContain(
        'This application has been accepted'
      )
    })

    test('renders the reason fieldset with legend', () => {
      const wrapper = createWrapper({ requiresReason: true })
      expect(wrapper.find('.withdraw-modal__fieldset').exists()).toBe(true)
      expect(wrapper.find('.withdraw-modal__legend').text()).toBe('Reason for withdrawal')
    })

    test('renders exactly two radio options', () => {
      const wrapper = createWrapper({ requiresReason: true })
      const radios = wrapper.findAll('input[type="radio"]')
      expect(radios).toHaveLength(2)
    })

    test('radio options have correct values and labels', () => {
      const wrapper = createWrapper({ requiresReason: true })
      const options = wrapper.findAll('.withdraw-modal__option')

      expect(options[0].find('input').attributes('value')).toBe('found_another_job')
      expect(options[0].find('span').text()).toBe('Found another job')

      expect(options[1].find('input').attributes('value')).toBe('personal_reasons')
      expect(options[1].find('span').text()).toBe('Personal reasons')
    })

    test('confirm button is disabled when no reason is selected', () => {
      const wrapper = createWrapper({ requiresReason: true })
      const confirmBtn = wrapper.find('.withdraw-modal__btn--confirm')
      expect(confirmBtn.attributes('disabled')).toBeDefined()
    })

    test('confirm button becomes enabled after selecting a reason', async () => {
      const wrapper = createWrapper({ requiresReason: true })
      const radio = wrapper.find('input[value="found_another_job"]')

      await radio.setValue(true)
      await nextTick()

      expect(wrapper.find('.withdraw-modal__btn--confirm').attributes('disabled')).toBeUndefined()
    })
  })

  describe('accessibility', () => {
    test('dialog has role="dialog" and aria-modal="true"', () => {
      const wrapper = createWrapper({ requiresReason: false })
      const dialog = wrapper.find('[role="dialog"]')
      expect(dialog.exists()).toBe(true)
      expect(dialog.attributes('aria-modal')).toBe('true')
    })

    test('dialog is labelled by the title element', () => {
      const wrapper = createWrapper({ requiresReason: false })
      const dialog = wrapper.find('[role="dialog"]')
      const titleId = dialog.attributes('aria-labelledby')
      expect(titleId).toBeTruthy()
      expect(wrapper.find(`#${titleId}`).text()).toBe('Withdraw application')
    })

    test('close button has aria-label', () => {
      const wrapper = createWrapper({ requiresReason: false })
      expect(wrapper.find('.withdraw-modal__close').attributes('aria-label')).toBe('Close')
    })

    test('all buttons have type="button"', () => {
      const wrapper = createWrapper({ requiresReason: false })
      wrapper.findAll('button').forEach(btn => {
        expect(btn.attributes('type')).toBe('button')
      })
    })
  })

  describe('cancel behaviour', () => {
    test('cancel button emits cancel', async () => {
      const wrapper = createWrapper({ requiresReason: false })
      await wrapper.find('.withdraw-modal__btn--cancel').trigger('click')
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    test('close (✕) button emits cancel', async () => {
      const wrapper = createWrapper({ requiresReason: false })
      await wrapper.find('.withdraw-modal__close').trigger('click')
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    test('clicking the overlay emits cancel', async () => {
      const wrapper = createWrapper({ requiresReason: false })
      await wrapper.find('.withdraw-modal__overlay').trigger('click')
      expect(onCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('confirm behaviour — no reason required', () => {
    test('emits confirm with undefined reason', async () => {
      const wrapper = createWrapper({ requiresReason: false })
      await wrapper.find('.withdraw-modal__btn--confirm').trigger('click')
      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(onConfirm).toHaveBeenCalledWith(undefined)
    })
  })

  describe('confirm behaviour — reason required', () => {
    test('does not emit confirm when no reason selected', async () => {
      const wrapper = createWrapper({ requiresReason: true })
      await wrapper.find('.withdraw-modal__btn--confirm').trigger('click')
      expect(onConfirm).not.toHaveBeenCalled()
    })

    test('emits confirm with "found_another_job" when that option is selected', async () => {
      const wrapper = createWrapper({ requiresReason: true })
      await wrapper.find('input[value="found_another_job"]').setValue(true)
      await nextTick()
      await wrapper.find('.withdraw-modal__btn--confirm').trigger('click')
      expect(onConfirm).toHaveBeenCalledWith('found_another_job')
    })

    test('emits confirm with "personal_reasons" when that option is selected', async () => {
      const wrapper = createWrapper({ requiresReason: true })
      await wrapper.find('input[value="personal_reasons"]').setValue(true)
      await nextTick()
      await wrapper.find('.withdraw-modal__btn--confirm').trigger('click')
      expect(onConfirm).toHaveBeenCalledWith('personal_reasons')
    })

    test('selecting a different reason updates the emitted value', async () => {
      const wrapper = createWrapper({ requiresReason: true })

      await wrapper.find('input[value="found_another_job"]').setValue(true)
      await nextTick()
      await wrapper.find('.withdraw-modal__btn--confirm').trigger('click')
      expect(onConfirm).toHaveBeenLastCalledWith('found_another_job')

      vi.clearAllMocks()

      await wrapper.find('input[value="personal_reasons"]').setValue(true)
      await nextTick()
      await wrapper.find('.withdraw-modal__btn--confirm').trigger('click')
      expect(onConfirm).toHaveBeenLastCalledWith('personal_reasons')
    })
  })
})
