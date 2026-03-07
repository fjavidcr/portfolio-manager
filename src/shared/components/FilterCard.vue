<script setup lang="ts">
import { ref } from 'vue'
import SearchIcon from '@shared/components/icons/SearchIcon.vue'
import ChevronRightIcon from '@shared/components/icons/ChevronRightIcon.vue'

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

const isExpanded = ref(false)
</script>

<template>
  <div
    class="sticky top-4 z-20 bg-surface-container-low shadow-lg rounded-2xl border border-outline-variant mb-6 backdrop-blur-sm transition-all overflow-hidden"
  >
    <!-- Mobile Header (Visible mainly on mobile, clicks to expand) -->
    <div 
      class="p-4 sm:hidden flex items-center justify-between cursor-pointer"
      @click="isExpanded = !isExpanded"
    >
      <div class="flex items-center gap-2">
        <span class="font-semibold text-on-surface">Filters & Search</span>
        <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary-container text-on-secondary-container">
          {{ resultCount }}
        </span>
      </div>
      <ChevronRightIcon 
        :class="`text-secondary transition-transform duration-300 ${isExpanded ? 'rotate-90' : '-rotate-90'}`"
      />
    </div>

    <!-- Content Area -->
    <div 
      class="p-4 sm:p-6 sm:block border-t border-outline-variant/30 sm:border-t-0"
      :class="isExpanded ? 'block' : 'hidden'"
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
      <div
        class="mt-4 pt-4 border-t border-outline-variant/30 flex justify-between items-center text-sm text-secondary"
      >
        <span class="hidden sm:inline">Showing {{ resultCount }} results</span>
        <span class="sm:hidden">
          <button @click="isExpanded = false" class="text-primary font-medium hover:underline">
            Close Filters
          </button>
        </span>
        <div class="flex items-center gap-2">
          <slot name="actions"></slot>
        </div>
      </div>
    </div>
  </div>
</template>
