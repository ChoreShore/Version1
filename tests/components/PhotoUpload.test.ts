import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import PhotoUpload from '~/components/primitives/PhotoUpload.vue';

const mockFetch = vi.fn();

describe('PhotoUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  it('renders dropzone when no photo is present', () => {
    const wrapper = mount(PhotoUpload, { props: { currentPhotoUrl: null } });
    expect(wrapper.find('.photo-upload__dropzone').exists()).toBe(true);
    expect(wrapper.find('.photo-upload__preview').exists()).toBe(false);
  });

  it('renders preview and actions when photo is present', () => {
    const wrapper = mount(PhotoUpload, {
      props: { currentPhotoUrl: 'https://example.com/photo.jpg' }
    });
    expect(wrapper.find('.photo-upload__preview').exists()).toBe(true);
    expect(wrapper.find('.photo-upload__image').attributes('src')).toBe('https://example.com/photo.jpg');
    expect(wrapper.find('.photo-upload__button--change').exists()).toBe(true);
    expect(wrapper.find('.photo-upload__button--delete').exists()).toBe(true);
  });

  it('emits uploadSuccess after successful upload', async () => {
    mockFetch.mockResolvedValue({ success: true, photoUrl: 'https://example.com/new.jpg' });
    const wrapper = mount(PhotoUpload, { props: { currentPhotoUrl: null } });

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    (wrapper.vm as any).selectedFile = file;
    (wrapper.vm as any).previewUrl = 'data:image/jpeg;base64,test';
    await nextTick();

    await wrapper.find('.photo-upload__button--upload').trigger('click');
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledWith('/api/profile/photo', expect.objectContaining({ method: 'POST' }));
    expect(wrapper.emitted('uploadSuccess')).toHaveLength(1);
    expect(wrapper.emitted('uploadSuccess')![0]).toEqual(['https://example.com/new.jpg']);
  });

  it('emits uploadError when upload fails', async () => {
    mockFetch.mockRejectedValue({ data: { statusMessage: 'Upload failed' } });
    const wrapper = mount(PhotoUpload, { props: { currentPhotoUrl: null } });

    const file = new File([''], 'test.png', { type: 'image/png' });
    (wrapper.vm as any).selectedFile = file;
    (wrapper.vm as any).previewUrl = 'data:image/png;base64,test';
    await nextTick();

    await wrapper.find('.photo-upload__button--upload').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('uploadError')).toHaveLength(1);
    expect(wrapper.emitted('uploadError')![0]).toEqual(['Upload failed']);
  });

  it('emits deleteSuccess after successful deletion', async () => {
    mockFetch.mockResolvedValue({});
    const wrapper = mount(PhotoUpload, {
      props: { currentPhotoUrl: 'https://example.com/photo.jpg' }
    });

    await wrapper.find('.photo-upload__button--delete').trigger('click');
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledWith('/api/profile/photo', expect.objectContaining({ method: 'DELETE' }));
    expect(wrapper.emitted('deleteSuccess')).toHaveLength(1);
  });

  it('resets preview on cancel', async () => {
    const wrapper = mount(PhotoUpload, { props: { currentPhotoUrl: null } });

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    (wrapper.vm as any).selectedFile = file;
    (wrapper.vm as any).previewUrl = 'data:image/jpeg;base64,test';
    await nextTick();

    expect(wrapper.find('.photo-upload__preview').exists()).toBe(true);

    await wrapper.find('.photo-upload__button--cancel').trigger('click');
    await nextTick();

    expect(wrapper.find('.photo-upload__dropzone').exists()).toBe(true);
    expect(wrapper.find('.photo-upload__preview').exists()).toBe(false);
  });
});
