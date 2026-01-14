<script setup lang="ts">
import SearchIcon from '@shared/components/icons/SearchIcon.vue'

interface Props {
  resultCount: number
  searchPlaceholder?: string
}

withDefaults(defineProps<Props>(), {
  searchPlaceholder: 'Search...'
})

const searchQuery = defineModel<string>('searchQuery', { required: true })

const emit = defineEmits<{
  clear: []
}>()
</script>

<template>
  <div
    class="sticky top-4 z-20 bg-surface-container-low shadow-lg rounded-2xl border border-outline-variant p-6 mb-6 backdrop-blur-sm"
  >
    <!-- Search Bar -->
    <div class="mb-4">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon class="text-gray-400" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="searchPlaceholder"
          class="block w-full pl-10 pr-3 py-3 bg-surface border border-outline-variant rounded-full text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
        />
      </div>
    </div>

    <!-- Filters Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Custom Filters Slot -->
      <slot name="filters"></slot>

      <!-- Clear Filters Button -->
      <div class="flex items-end">
        <button
          class="w-full px-4 py-2 bg-surface-container-high hover:bg-surface-container transition-colors text-on-surface rounded-lg text-sm font-medium border border-outline-variant"
          @click="emit('clear')"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Results Count Footer -->
    <div class="mt-4 pt-4 flex justify-between items-center text-sm text-secondary">
      <span>Showing {{ resultCount }} results</span>
    </div>
  </div>
</template>
