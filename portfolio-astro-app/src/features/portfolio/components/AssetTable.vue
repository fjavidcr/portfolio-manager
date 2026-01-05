<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from '@nanostores/vue';
import { portfolioStore } from '@features/portfolio/stores/portfolioStore';
import { formatCurrency } from '@shared/lib/utils';

const $portfolio = useStore(portfolioStore);
const searchQuery = ref('');

const filteredAssets = computed(() => {
  if (!$portfolio.value.assets) return [];
  return $portfolio.value.assets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    asset.id.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

</script>

<template>
  <div class="bg-surface-container-low shadow rounded-2xl border border-outline-variant p-6">
    <div class="mb-6">
      <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search assets..."
            class="block w-full pl-10 pr-3 py-3 bg-surface border border-outline-variant rounded-full text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
          />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="$portfolio.loading" class="text-center py-10">
         <svg class="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
         <p class="mt-2 text-sm text-gray-400">Loading assets...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredAssets.length === 0" class="text-center py-10 text-gray-400">
        No assets found.
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-outline-variant">
        <thead>
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Asset</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Current Value</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Platform</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant">
          <tr v-for="asset in filteredAssets" :key="asset.id" class="hover:bg-surface-container-high transition-colors">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="ml-4">
                  <div class="text-sm font-medium text-on-surface">{{ asset.name }}</div>
                  <div class="text-sm text-gray-400">{{ asset.id }}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-secondary-container text-on-secondary-container">
                {{ asset.type }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-on-surface font-medium">
              {{ formatCurrency(asset.currentValue) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
              {{ asset.platformId }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
