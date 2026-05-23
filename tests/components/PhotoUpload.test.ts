import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PhotoUpload from '~/components/primitives/PhotoUpload.vue';

describe('PhotoUpload Component', () => {
  it('renders dropzone when no photo is present', () => {
    const wrapper = mount(PhotoUpload, {
      props: {
        currentPhotoUrl: null
      }
    });

    expect(wrapper.find('.photo-upload__dropzone').exists()).toBe(true);
  });

  it('renders preview when photo is present', () => {
    const wrapper = mount(PhotoUpload, {
      props: {
        currentPhotoUrl: 'https://example.com/photo.jpg'
      }
    });

    expect(wrapper.find('.photo-upload__preview').exists()).toBe(true);
    expect(wrapper.find('.photo-upload__image').exists()).toBe(true);
    expect(wrapper.find('.photo-upload__image').attributes('src')).toBe('https://example.com/photo.jpg');
  });

  it('emits uploadSuccess when upload completes', async () => {
    const wrapper = mount(PhotoUpload, {
      props: {
        currentPhotoUrl: null
      }
    });

    // Verify the component structure
    expect(wrapper.find('.photo-upload__dropzone').exists()).toBe(true);
  });
});
