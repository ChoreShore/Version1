import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ApplicationActions from '~/components/applications/ApplicationActions.vue'

describe('ApplicationActions', () => {
  let mockAction: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockAction = vi.fn()
    vi.clearAllMocks()
  })

  const createWrapper = (props: any = {}) => {
    return mount(ApplicationActions, {
      props: {
        onAction: mockAction,
        ...props
      },
      global: {
        stubs: {
          // Stub any child components if needed
        }
      }
    })
  }

  const createMockApplication = (status: string = 'pending') => ({
    id: 'app-123',
    job_id: 'job-456',
    worker_id: 'worker-789',
    status: status as 'pending' | 'accepted' | 'rejected' | 'withdrawn',
    cover_letter: 'I am interested in this job',
    proposed_rate: 150,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  })

  // Helper function to check if button is disabled
  const isButtonDisabled = (button: any) => {
    const disabledAttr = button.attributes('disabled')
    return disabledAttr === 'true' || disabledAttr === ''
  }

  // Helper function to check if button is enabled
  const isButtonEnabled = (button: any) => {
    const disabledAttr = button.attributes('disabled')
    return disabledAttr === undefined
  }

  describe('component rendering', () => {
    test('should render all three action buttons', () => {
      // Arrange
      const application = createMockApplication()

      // Act
      const wrapper = createWrapper({ application })

      // Assert
      expect(wrapper.find('.application-actions').exists()).toBe(true)
      expect(wrapper.findAll('.application-actions__button')).toHaveLength(3)
      
      const buttons = wrapper.findAll('.application-actions__button')
      expect(buttons[0].text()).toBe('Move to pending')
      expect(buttons[1].text()).toBe('Accept')
      expect(buttons[2].text()).toBe('Reject')
    })

    test('should apply correct CSS classes to buttons', () => {
      // Arrange
      const application = createMockApplication()

      // Act
      const wrapper = createWrapper({ application })

      // Assert
      const buttons = wrapper.findAll('.application-actions__button')
      expect(buttons[0].classes()).toContain('application-actions__button--pending')
      expect(buttons[1].classes()).toContain('application-actions__button--success')
      expect(buttons[2].classes()).toContain('application-actions__button--danger')
    })

    test('should render buttons with proper HTML attributes', () => {
      // Arrange
      const application = createMockApplication()

      // Act
      const wrapper = createWrapper({ application })

      // Assert
      const buttons = wrapper.findAll('.application-actions__button')
      buttons.forEach(button => {
        expect(button.element.tagName).toBe('BUTTON')
        expect(button.attributes('type')).toBe('button')
      })
    })
  })

  describe('button state based on application status', () => {
    test('should enable all buttons when application is pending', () => {
      // Arrange
      const application = createMockApplication('pending')

      // Act
      const wrapper = createWrapper({ application })

      // Assert - Pending button should be disabled (can't move to same status)
      const buttons = wrapper.findAll('.application-actions__button')
      expect(isButtonDisabled(buttons[0])).toBe(true) // Pending button disabled
      expect(isButtonEnabled(buttons[1])).toBe(true)  // Accept button enabled
      expect(isButtonEnabled(buttons[2])).toBe(true)  // Reject button enabled
    })

    test('should disable pending button when application is already pending', () => {
      // Arrange
      const application = createMockApplication('pending')

      // Act
      const wrapper = createWrapper({ application })
      const pendingButton = wrapper.findAll('.application-actions__button')[0]

      // Assert
      expect(isButtonDisabled(pendingButton)).toBe(true)
    })

    test('should disable accept button when application is already accepted', () => {
      // Arrange
      const application = createMockApplication('accepted')

      // Act
      const wrapper = createWrapper({ application })
      const acceptButton = wrapper.findAll('.application-actions__button')[1]

      // Assert - Accept button should be disabled
      expect(isButtonDisabled(acceptButton)).toBe(true)
    })

    test('should disable reject button when application is already rejected', () => {
      // Arrange
      const application = createMockApplication('rejected')

      // Act
      const wrapper = createWrapper({ application })
      const rejectButton = wrapper.findAll('.application-actions__button')[2]

      // Assert
      expect(isButtonDisabled(rejectButton)).toBe(true)
    })

    test('should enable all buttons when application is withdrawn', () => {
      // Arrange
      const application = createMockApplication('withdrawn')

      // Act
      const wrapper = createWrapper({ application })

      // Assert
      const buttons = wrapper.findAll('.application-actions__button')
      buttons.forEach(button => {
        expect(button.attributes('disabled')).toBeUndefined()
      })
    })

    test('should disable all buttons when disabled prop is true', () => {
      // Arrange
      const application = createMockApplication('pending')

      // Act
      const wrapper = createWrapper({ application, disabled: true })

      // Assert
      const buttons = wrapper.findAll('.application-actions__button')
      buttons.forEach(button => {
        expect(isButtonDisabled(button)).toBe(true)
      })
    })

    test('should enable buttons based on both status and disabled prop', () => {
      // Arrange
      const acceptedApplication = createMockApplication('accepted')

      // Act
      const wrapper = createWrapper({ application: acceptedApplication, disabled: true })

      // Assert - All buttons should be disabled when disabled prop is true
      const buttons = wrapper.findAll('.application-actions__button')
      buttons.forEach(button => {
        expect(isButtonDisabled(button)).toBe(true)
      })
    })

    test('should respect status-based disabled when disabled prop is false', () => {
      // Arrange
      const acceptedApplication = createMockApplication('accepted')

      // Act
      const wrapper = createWrapper({ application: acceptedApplication, disabled: false })

      // Assert - Accept button should be disabled due to status, not due to disabled prop
      const acceptButton = wrapper.findAll('.application-actions__button')[1]
      expect(isButtonDisabled(acceptButton)).toBe(true)
      
      // Other buttons should be enabled
      const pendingButton = wrapper.findAll('.application-actions__button')[0]
      const rejectButton = wrapper.findAll('.application-actions__button')[2]
      expect(isButtonDisabled(pendingButton)).toBe(false)
      expect(isButtonDisabled(rejectButton)).toBe(false)
    })
  })

  describe('button click behavior', () => {
    test('should emit action event when pending button is clicked', async () => {
      // Arrange
      const application = createMockApplication('withdrawn') // Use withdrawn so pending button is enabled
      const wrapper = createWrapper({ application })
      const pendingButton = wrapper.findAll('.application-actions__button')[0]

      // Act
      await pendingButton.trigger('click')
      await nextTick()

      // Assert
      expect(mockAction).toHaveBeenCalledWith('app-123', 'pending')
    })

    test('should emit action event when accept button is clicked', async () => {
      // Arrange
      const application = createMockApplication('pending')
      const wrapper = createWrapper({ application })
      const acceptButton = wrapper.findAll('.application-actions__button')[1]

      // Act
      await acceptButton.trigger('click')
      await nextTick()

      // Assert
      expect(mockAction).toHaveBeenCalledWith('app-123', 'accepted')
    })

    test('should emit action event when reject button is clicked', async () => {
      // Arrange
      const application = createMockApplication('pending')
      const wrapper = createWrapper({ application })
      const rejectButton = wrapper.findAll('.application-actions__button')[2]

      // Act
      await rejectButton.trigger('click')
      await nextTick()

      // Assert
      expect(mockAction).toHaveBeenCalledWith('app-123', 'rejected')
    })

    test('should not emit events when disabled button is clicked', async () => {
      // Arrange
      const application = createMockApplication('accepted')
      const wrapper = createWrapper({ application })
      const acceptButton = wrapper.findAll('.application-actions__button')[1]

      // Act
      await acceptButton.trigger('click')
      await nextTick()

      // Assert
      expect(mockAction).not.toHaveBeenCalled()
    })

    test('should not emit events when component disabled prop is true', async () => {
      // Arrange
      const application = createMockApplication('pending')
      const wrapper = createWrapper({ application, disabled: true })
      const pendingButton = wrapper.findAll('.application-actions__button')[0]

      // Act
      await pendingButton.trigger('click')
      await nextTick()

      // Assert
      expect(mockAction).not.toHaveBeenCalled()
    })
  })

  describe('multiple action calls', () => {
    test('should handle multiple different actions in sequence', async () => {
      // Arrange
      const application = createMockApplication('withdrawn') // Use withdrawn so all buttons are enabled
      const wrapper = createWrapper({ application })
      const buttons = wrapper.findAll('.application-actions__button')

      // Act - Click all buttons when they're enabled
      await buttons[0].trigger('click') // Move to pending
      await nextTick()
      
      await buttons[1].trigger('click') // Accept
      await nextTick()
      
      await buttons[2].trigger('click') // Reject
      await nextTick()

      // Assert - All events should be emitted
      expect(mockAction).toHaveBeenCalledTimes(3)
      expect(mockAction).toHaveBeenNthCalledWith(1, 'app-123', 'pending')
      expect(mockAction).toHaveBeenNthCalledWith(2, 'app-123', 'accepted')
      expect(mockAction).toHaveBeenNthCalledWith(3, 'app-123', 'rejected')
    })

    test('should handle repeated same action clicks', async () => {
      // Arrange
      const application = createMockApplication('pending')
      const wrapper = createWrapper({ application })
      const acceptButton = wrapper.findAll('.application-actions__button')[1]

      // Act
      await acceptButton.trigger('click')
      await nextTick()
      await acceptButton.trigger('click')
      await nextTick()

      // Assert
      expect(mockAction).toHaveBeenCalledTimes(2)
      expect(mockAction).toHaveBeenNthCalledWith(1, 'app-123', 'accepted')
      expect(mockAction).toHaveBeenNthCalledWith(2, 'app-123', 'accepted')
    })
  })

  describe('edge cases', () => {
    test('should handle application with missing required properties', () => {
      // Arrange
      const incompleteApplication = {
        id: 'app-123',
        status: 'pending'
        // Missing other required properties
      }

      // Act & Assert - Should not crash and still render buttons
      expect(() => {
        const wrapper = createWrapper({ application: incompleteApplication })
        expect(wrapper.find('.application-actions').exists()).toBe(true)
        expect(wrapper.findAll('.application-actions__button')).toHaveLength(3)
      }).not.toThrow()
    })

    test('should handle empty application object', () => {
      // Arrange
      const emptyApplication = {}

      // Act & Assert - Should not crash
      expect(() => {
        const wrapper = createWrapper({ application: emptyApplication })
        expect(wrapper.find('.application-actions').exists()).toBe(true)
      }).not.toThrow()
    })

    test('should handle null application', () => {
      // Arrange
      const nullApplication = null

      // Act & Assert - Should not crash and still render buttons
      expect(() => {
        const wrapper = createWrapper({ application: nullApplication })
        expect(wrapper.find('.application-actions').exists()).toBe(true)
        expect(wrapper.findAll('.application-actions__button')).toHaveLength(3)
      }).not.toThrow()
    })

    test('should handle undefined application', () => {
      // Arrange
      const undefinedApplication = undefined

      // Act & Assert - Should not crash and still render buttons
      expect(() => {
        const wrapper = createWrapper({ application: undefinedApplication })
        expect(wrapper.find('.application-actions').exists()).toBe(true)
        expect(wrapper.findAll('.application-actions__button')).toHaveLength(3)
      }).not.toThrow()
    })

    test('should handle rapid clicking on different buttons', async () => {
      // Arrange
      const application = createMockApplication('pending')
      const wrapper = createWrapper({ application })
      const buttons = wrapper.findAll('.application-actions__button')

      // Act - Rapid clicking on different buttons
      await buttons[0].trigger('click') // Move to pending (will be disabled due to status)
      await nextTick()
      
      await buttons[1].trigger('click') // Accept
      await nextTick()
      
      await buttons[2].trigger('click') // Reject
      await nextTick()

      // Assert - Only 2 events should be emitted (pending button disabled, so no event)
      expect(mockAction).toHaveBeenCalledTimes(2)
      expect(mockAction).toHaveBeenNthCalledWith(1, 'app-123', 'accepted')
      expect(mockAction).toHaveBeenNthCalledWith(2, 'app-123', 'rejected')
    })
  })

  describe('accessibility compliance', () => {
    test('should have proper button semantics', () => {
      // Arrange
      const application = createMockApplication()

      // Act
      const wrapper = createWrapper({ application })

      // Assert
      const buttons = wrapper.findAll('.application-actions__button')
      buttons.forEach(button => {
        expect(button.element.tagName).toBe('BUTTON')
        expect(button.attributes('type')).toBe('button')
      })
    })

    test('should have descriptive button text', () => {
      // Arrange
      const application = createMockApplication()

      // Act
      const wrapper = createWrapper({ application })

      // Assert
      const buttons = wrapper.findAll('.application-actions__button')
      expect(buttons[0].text()).toBe('Move to pending')
      expect(buttons[1].text()).toBe('Accept')
      expect(buttons[2].text()).toBe('Reject')
    })

    test('should indicate disabled state for accessibility', () => {
      // Arrange
      const acceptedApplication = createMockApplication('accepted')

      // Act
      const wrapper = createWrapper({ application: acceptedApplication })
      const acceptButton = wrapper.findAll('.application-actions__button')[1]

      // Assert
      expect(isButtonDisabled(acceptButton)).toBe(true)
    })
  })

  describe('integration scenarios', () => {
    test('should work with different application statuses', () => {
      // Test all possible statuses
      const statuses = ['pending', 'accepted', 'rejected', 'withdrawn']
      
      statuses.forEach(status => {
        const application = createMockApplication(status)
        const wrapper = createWrapper({ application })
        
        // Should render without errors
        expect(wrapper.find('.application-actions').exists()).toBe(true)
        expect(wrapper.findAll('.application-actions__button')).toHaveLength(3)
      })
    })

    test('should handle status changes during component lifecycle', async () => {
      // Arrange
      const initialApplication = createMockApplication('pending')
      const wrapper = createWrapper({ application: initialApplication })
      
      // Verify initial state
      const initialAcceptButton = wrapper.findAll('.application-actions__button')[1]
      expect(isButtonDisabled(initialAcceptButton)).toBe(false)
      expect(initialAcceptButton.text()).toBe('Accept')

      // Act - Change application status
      const acceptedApplication = createMockApplication('accepted')
      await wrapper.setProps({ application: acceptedApplication })
      await nextTick()

      // Assert - Button should now be disabled
      const acceptButton = wrapper.findAll('.application-actions__button')[1]
      expect(isButtonDisabled(acceptButton)).toBe(true)
    })
  })
})
