import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, nextTick } from 'vue';
import PhotoSettingsSection from '~/components/profile/PhotoSettingsSection.vue';

const mockUser = ref({ id: 'user-1' });
const mockFrom = vi.fn();
const mockSupabaseClient = { from: mockFrom };

const flushAsync = () => new Promise(resolve => setTimeout(resolve, 10));

describe('PhotoSettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.value = { id: 'user-1' };
    (globalThis as any).useSupabaseUser = () => mockUser;
    (globalThis as any).useSupabaseClient = () => mockSupabaseClient;
  });

  const createWrapper = () =>
    mount(PhotoSettingsSection, {
      global: { stubs: { PhotoUpload: true } }
    });

  it('shows loading state initially', () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { photo_url: 'https://example.com/photo.jpg' }, error: null })
        })
      })
    });
    const wrapper = createWrapper();
    expect(wrapper.find('.photo-settings__loading').exists()).toBe(true);
  });

  it('fetches photo URL on mount', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { photo_url: 'https://example.com/photo.jpg' }, error: null })
        })
      })
    });
    const wrapper = createWrapper();
    await flushAsync();

    expect(wrapper.find('.photo-settings__loading').exists()).toBe(false);
    expect((wrapper.vm as any).currentPhotoUrl).toBe('https://example.com/photo.jpg');
  });

  it('handles null photo_url', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { photo_url: null }, error: null })
        })
      })
    });
    const wrapper = createWrapper();
    await flushAsync();

    expect((wrapper.vm as any).currentPhotoUrl).toBeNull();
  });

  it('shows error on fetch failure', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'DB error' } })
        })
      })
    });
    const wrapper = createWrapper();
    await flushAsync();

    expect((wrapper.vm as any).error).toBe('DB error');
  });

  it('updates photo on upload-success emit', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { photo_url: null }, error: null })
        })
      })
    });
    const wrapper = createWrapper();
    await flushAsync();

    const photoUpload = wrapper.findComponent({ name: 'PhotoUpload' });
    await photoUpload.vm.$emit('upload-success', 'https://example.com/new.jpg');
    await nextTick();

    expect((wrapper.vm as any).currentPhotoUrl).toBe('https://example.com/new.jpg');
    expect((wrapper.vm as any).success).toBe('Photo updated successfully');
  });

  it('clears photo on delete-success emit', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { photo_url: 'https://example.com/photo.jpg' }, error: null })
        })
      })
    });
    const wrapper = createWrapper();
    await flushAsync();

    const photoUpload = wrapper.findComponent({ name: 'PhotoUpload' });
    await photoUpload.vm.$emit('delete-success');
    await nextTick();

    expect((wrapper.vm as any).currentPhotoUrl).toBeNull();
    expect((wrapper.vm as any).success).toBe('Photo removed successfully');
  });

  it('shows error on upload-error emit', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { photo_url: null }, error: null })
        })
      })
    });
    const wrapper = createWrapper();
    await flushAsync();

    const photoUpload = wrapper.findComponent({ name: 'PhotoUpload' });
    await photoUpload.vm.$emit('upload-error', 'Upload failed');
    await nextTick();

    expect((wrapper.vm as any).error).toBe('Upload failed');
  });
});
