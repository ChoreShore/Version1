import { computed, ref } from 'vue';
import type { Ref, ComputedRef } from 'vue';

export interface FilterableBase {
  title: string;
  description: string;
  category_name?: string;
  postcode_area?: string;
}

export interface UseJobFilterReturn<T extends FilterableBase> {
  searchQuery: Ref<string>;
  activeCategory: Ref<string | null>;
  categories: { id: string; label: string; icon: string }[];
  filteredJobs: ComputedRef<T[]>;
  setCategory: (id: string | null) => void;
  clearFilters: () => void;
}

const DEFAULT_CATEGORIES = [
  { id: 'nearby', label: 'Nearby', icon: '📍' },
  { id: 'remote', label: 'Remote', icon: 'laptop' },
  { id: 'cleaning', label: 'Cleaning', icon: 'brush' },
  { id: 'moving', label: 'Moving', icon: 'truck' },
  { id: 'handyman', label: 'Handyman', icon: 'hammer' }
];

export function useJobFilter<T extends FilterableBase>(
  jobs: Ref<T[]> | ComputedRef<T[]>
): UseJobFilterReturn<T> {
  const searchQuery = ref('');
  const activeCategory = ref<string | null>(null);

  const filteredJobs = computed(() => {
    let result = jobs.value;

    // Category filter
    if (activeCategory.value === 'remote') {
      result = result.filter((j) => !j.postcode_area || j.postcode_area.toLowerCase().includes('remote'));
    }
    if (activeCategory.value && ['cleaning', 'moving', 'handyman'].includes(activeCategory.value)) {
      const target = activeCategory.value.toLowerCase();
      result = result.filter((j) => j.category_name?.toLowerCase().includes(target));
    }

    // Search filter
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      result = result.filter((j) =>
        j.title.toLowerCase().includes(q) || j.description.toLowerCase().includes(q)
      );
    }

    return result;
  });

  function setCategory(id: string | null) {
    activeCategory.value = activeCategory.value === id ? null : id;
  }

  function clearFilters() {
    searchQuery.value = '';
    activeCategory.value = null;
  }

  return {
    searchQuery,
    activeCategory,
    categories: DEFAULT_CATEGORIES,
    filteredJobs,
    setCategory,
    clearFilters
  };
}
