import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { onMounted, onUnmounted } from 'vue';
import Carousel from '~/components/primitives/Carousel.vue';

vi.mock('@lucide/vue', () => ({
  ChevronLeft: { template: '<span>left</span>' },
  ChevronRight: { template: '<span>right</span>' }
}));

describe('Carousel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).onMounted = onMounted;
    (globalThis as any).onUnmounted = onUnmounted;
  });

  it('renders slot content in track', () => {
    const wrapper = mount(Carousel, {
      slots: { default: '<div class="item">Item 1</div><div class="item">Item 2</div>' }
    });
    expect(wrapper.findAll('.item')).toHaveLength(2);
  });

  it('has carousel class on root', () => {
    const wrapper = mount(Carousel);
    expect(wrapper.find('.carousel').exists()).toBe(true);
  });

  it('has track element with tabindex=0', () => {
    const wrapper = mount(Carousel);
    const track = wrapper.find('.carousel__track');
    expect(track.exists()).toBe(true);
    expect(track.attributes('tabindex')).toBe('0');
  });

  it('hides left arrow initially (canScrollLeft false)', () => {
    const wrapper = mount(Carousel);
    const leftArrow = wrapper.find('.carousel__arrow--left');
    expect(leftArrow.isVisible()).toBe(false);
  });

  it('hides right arrow when no overflow (canScrollRight false)', () => {
    const wrapper = mount(Carousel);
    const rightArrow = wrapper.find('.carousel__arrow--right');
    expect(rightArrow.isVisible()).toBe(false);
  });

  it('left arrow has aria-label "Scroll left"', () => {
    const wrapper = mount(Carousel);
    expect(wrapper.find('.carousel__arrow--left').attributes('aria-label')).toBe('Scroll left');
  });

  it('right arrow has aria-label "Scroll right"', () => {
    const wrapper = mount(Carousel);
    expect(wrapper.find('.carousel__arrow--right').attributes('aria-label')).toBe('Scroll right');
  });

  it('calls track.scrollBy when left arrow clicked', async () => {
    const wrapper = mount(Carousel);
    const track = wrapper.find('.carousel__track').element as HTMLElement;
    Object.defineProperty(track, 'clientWidth', { configurable: true, get: () => 300 });
    track.scrollBy = vi.fn();
    wrapper.find('.carousel__track').element.scrollLeft = 100;
    await wrapper.find('.carousel__track').trigger('scroll');
    await wrapper.find('.carousel__arrow--left').trigger('click');
    expect(track.scrollBy).toHaveBeenCalled();
    expect((track.scrollBy as any).mock.calls[0][0].left).toBeLessThan(0);
  });

  it('calls track.scrollBy when right arrow clicked', async () => {
    const wrapper = mount(Carousel);
    const track = wrapper.find('.carousel__track').element as HTMLElement;
    Object.defineProperty(track, 'clientWidth', { configurable: true, get: () => 300 });
    track.scrollBy = vi.fn();
    await wrapper.find('.carousel__arrow--right').trigger('click');
    expect(track.scrollBy).toHaveBeenCalled();
    expect((track.scrollBy as any).mock.calls[0][0].left).toBeGreaterThan(0);
  });

  it('updates arrow visibility on scroll', async () => {
    const wrapper = mount(Carousel);
    const track = wrapper.find('.carousel__track');
    const el = track.element as HTMLElement;

    Object.defineProperty(el, 'scrollLeft', { configurable: true, get: () => 50, set: () => {} });
    Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => 200 });
    Object.defineProperty(el, 'scrollWidth', { configurable: true, get: () => 500 });

    await track.trigger('scroll');
    expect(wrapper.find('.carousel__arrow--left').isVisible()).toBe(true);
    expect(wrapper.find('.carousel__arrow--right').isVisible()).toBe(true);
  });
});
