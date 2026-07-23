<template>
  <div class="carousel" @keydown.left="scrollLeft" @keydown.right="scrollRight">
    <button
      v-show="canScrollLeft"
      type="button"
      class="carousel__arrow carousel__arrow--left"
      aria-label="Scroll left"
      @click="scrollLeft"
    >
      <ChevronLeft :size="20" />
    </button>

    <div
      ref="trackRef"
      class="carousel__track"
      tabindex="0"
      @scroll="handleScroll"
    >
      <slot />
    </div>

    <button
      v-show="canScrollRight"
      type="button"
      class="carousel__arrow carousel__arrow--right"
      aria-label="Scroll right"
      @click="scrollRight"
    >
      <ChevronRight :size="20" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ChevronLeft, ChevronRight } from '@lucide/vue';

const props = withDefaults(defineProps<{
  itemWidth?: number;
  gap?: number;
}>(), {
  itemWidth: 280,
  gap: 16,
});

const trackRef = ref<HTMLDivElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

function updateArrows() {
  const track = trackRef.value;
  if (!track) return;
  const tolerance = 2;
  canScrollLeft.value = track.scrollLeft > tolerance;
  canScrollRight.value = track.scrollLeft + track.clientWidth < track.scrollWidth - tolerance;
}

function handleScroll() {
  updateArrows();
}

function scrollLeft() {
  const track = trackRef.value;
  if (!track) return;
  const scrollAmount = track.clientWidth - props.gap;
  track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
}

function scrollRight() {
  const track = trackRef.value;
  if (!track) return;
  const scrollAmount = track.clientWidth - props.gap;
  track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  updateArrows();
  if (typeof ResizeObserver !== 'undefined' && trackRef.value) {
    resizeObserver = new ResizeObserver(updateArrows);
    resizeObserver.observe(trackRef.value);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<style>
.carousel {
  position: relative;
  display: flex;
  align-items: center;
}

.carousel__track {
  display: flex;
  gap: var(--space-4);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: var(--space-2) 0;
  width: 100%;
}

.carousel__track::-webkit-scrollbar {
  display: none;
}

.carousel__track > * {
  flex: 0 0 280px;
  scroll-snap-align: start;
}

.carousel__arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: background 120ms ease, transform 80ms ease;
}

.carousel__arrow:hover {
  background: var(--color-surface-muted);
  transform: translateY(-50%) scale(1.05);
}

.carousel__arrow:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
}

.carousel__arrow--left {
  left: -12px;
}

.carousel__arrow--right {
  right: -12px;
}

@media (max-width: 768px) {
  .carousel__arrow {
    display: none !important;
  }

  .carousel__track {
    scroll-padding-left: var(--space-4);
    padding-left: var(--space-4);
    padding-right: var(--space-4);
  }
}
</style>
