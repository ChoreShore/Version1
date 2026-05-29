import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, nextTick } from 'vue';
import BioSettingsSection from '~/components/profile/BioSettingsSection.vue';

const mockUser = ref({ id: 'user-1' });
const mockFrom = vi.fn();
const mockSupabaseClient = { from: mockFrom };
const mockFetch = vi.fn();

const flushAsync = () => new Promise(resolve => setTimeout(resolve, 10));

vi.mock('~/composables/useActiveRole', () => ({
  useActiveRole: vi.fn(() => ({ isWorker: { value: true } }))
}));

describe('BioSettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
    mockUser.value = { id: 'user-1' };
    (globalThis as any).useSupabaseUser = () => mockUser;
    (globalThis as any).useSupabaseClient = () => mockSupabaseClient;
  });

  const createWrapper = () =>
    mount(BioSettingsSection, {
      global: {
        stubs: {
          FormField: true,
          FormLabel: true,
          FormControl: true,
          FormHint: true,
          FormError: true,
        }
      }
    });

  it('shows loading state initially', () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { bio: 'Hello' }, error: null })
        })
      })
    });
    const wrapper = createWrapper();
    expect(wrapper.find('.bio-settings__loading').exists()).toBe(true);
  });

  it('fetches and displays bio on mount', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { bio: 'I am a gardener' }, error: null })
        })
      })
    });
    const wrapper = createWrapper();
    await flushAsync();

    expect(wrapper.find('.bio-settings__loading').exists()).toBe(false);
    expect((wrapper.vm as any).bio).toBe('I am a gardener');
  });

  it('submits bio via PATCH /api/profile/bio', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { bio: '' }, error: null })
        })
      })
    });
    mockFetch.mockResolvedValue({ success: true, bio: 'New bio text' });

    const wrapper = createWrapper();
    await flushAsync();

    (wrapper.vm as any).bio = 'New bio text';
    await nextTick();

    (wrapper.vm as any).handleSave();
    await flushAsync();

    expect(mockFetch).toHaveBeenCalledWith('/api/profile/bio', {
      method: 'PATCH',
      body: { bio: 'New bio text' }
    });
    expect((wrapper.vm as any).success).toBe('Bio saved successfully');
  });

  it('shows error when save fails', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { bio: 'Old bio' }, error: null })
        })
      })
    });
    mockFetch.mockRejectedValue({ data: { statusMessage: 'Server error' } });

    const wrapper = createWrapper();
    await flushAsync();

    (wrapper.vm as any).bio = 'Changed';
    await nextTick();

    (wrapper.vm as any).handleSave();
    await flushAsync();

    expect((wrapper.vm as any).error).toBe('Server error');
  });

  it('disables submit when no changes', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { bio: 'Same' }, error: null })
        })
      })
    });

    const wrapper = createWrapper();
    await flushAsync();

    expect((wrapper.vm as any).hasChanges).toBe(false);
  });
});
