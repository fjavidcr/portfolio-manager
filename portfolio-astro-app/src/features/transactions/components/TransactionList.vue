<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { portfolioStore, fetchTransactions, setFilters } from '@shared/stores/portfolioStore'
import { TransactionTypes } from '@shared/types'
import { watch, onMounted, ref, onUnmounted, computed } from 'vue'
import TransactionCard from './TransactionCard.vue'
import FilterCard from '@shared/components/FilterCard.vue'
import FilterSelect, { type FilterOption } from '@shared/components/FilterSelect.vue'
import LoadingSpinner from '@shared/components/icons/LoadingSpinner.vue'

const $portfolio = useStore(portfolioStore)
const observerTarget = ref<HTMLElement | null>(null)

// Search and Filter State
const searchQuery = ref('')
const selectedType = ref('')
const selectedAsset = ref('')

// Watch filters to ensure we have all data loaded
// Watch filters and trigger server-side fetch
watch([selectedType, selectedAsset], ([type, asset]) => {
  setFilters({
    type: type,
    assetId: asset
  })
})

// Filtered Transactions
const filteredTransactions = computed(() => {
  let result = $portfolio.value.transactions

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((tx) => {
      const assetName = $portfolio.value.assets.find((a) => a.id === tx.assetId)?.name || ''
      return (
        tx.type.toLowerCase().includes(query) ||
        tx.assetId.toLowerCase().includes(query) ||
        assetName.toLowerCase().includes(query) ||
        (tx.description && tx.description.toLowerCase().includes(query)) ||
        tx.amount.toString().includes(query)
      )
    })
  }

  return result
})

// transactionTypes is imported from @shared/types

// Compute counts for each transaction type based on loaded transactions
const typeCounts = computed(() => {
  const counts: Record<string, number> = {}
  $portfolio.value.transactions.forEach((tx) => {
    counts[tx.type] = (counts[tx.type] || 0) + 1
  })
  return counts
})

// Prepare options for FilterSelect components
const typeFilterOptions = computed<FilterOption[]>(() => {
  return TransactionTypes.map(type => ({
    value: type,
    label: type,
    count: typeCounts.value[type] || 0
  }))
})

const assetFilterOptions = computed<FilterOption[]>(() => {
  return $portfolio.value.assets.map(asset => ({
    value: asset.id,
    label: `${asset.name} (${asset.id})`,
    count: undefined
  }))
})

onMounted(() => {
  // Setup Intersection Observer for Infinite Scroll
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !$portfolio.value.loading && $portfolio.value.hasMore) {
        fetchTransactions()
      }
    },
    {
      root: null,
      threshold: 0.1,
      rootMargin: '100px' // Load 100px before end
    }
  )

  if (observerTarget.value) {
    observer.observe(observerTarget.value)
  }

  // Initial fetch handled by store subscription but ensure check
  if ($portfolio.value.transactions.length === 0) {
    fetchTransactions(true)
  }

  onUnmounted(() => {
    if (observerTarget.value) observer.unobserve(observerTarget.value)
    observer.disconnect()
  })
})

const clearFilters = () => {
  searchQuery.value = ''
  selectedType.value = ''
  selectedAsset.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <!-- Search and Filters -->
    <FilterCard v-model:search-query="searchQuery" :result-count="filteredTransactions.length"
      search-placeholder="Search transactions..." @clear="clearFilters"
    >
      <template #filters>
        <!-- Type Filter -->
        <FilterSelect id="type-filter" v-model="selectedType" label="Type" :options="typeFilterOptions"
          all-label="All Types" />

        <!-- Asset Filter -->
        <FilterSelect id="asset-filter" v-model="selectedAsset" label="Asset" :options="assetFilterOptions"
          all-label="All Assets" />
      </template>
    </FilterCard>

    <!-- Initial Loading State (Only when empty) -->
    <div
      v-if="$portfolio.loading && $portfolio.transactions.length === 0"
      class="text-center py-10"
    >
      <LoadingSpinner size="lg" class="text-primary mx-auto" />
      <p class="mt-2 text-sm text-secondary">Loading transactions...</p>
    </div>

    <!-- Empty State (No transactions after load) -->
    <div
      v-else-if="!$portfolio.loading && $portfolio.transactions.length === 0"
      class="text-center py-10 text-secondary"
    >
      No transactions found.
    </div>

    <!-- No Results After Filtering -->
    <div v-else-if="filteredTransactions.length === 0" class="text-center py-10 text-secondary">
      No transactions match your filters. Try adjusting your search or filters.
    </div>

    <!-- Error State -->
    <div
      v-if="$portfolio.error"
      class="bg-error-container text-on-error-container p-4 rounded-lg mb-6 flex items-start gap-3"
    >
      <svg
        class="h-5 w-5 mt-0.5 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <div>
        <h3 class="font-medium">Error loading transactions</h3>
        <p class="text-sm opacity-90">{{ $portfolio.error }}</p>
        <p v-if="$portfolio.missingIndex" class="text-sm mt-2 underline">
          <a href="#" class="hover:text-white">Check console for index creation link</a>
        </p>
      </div>
    </div>
    <!-- Transaction List (Always show if we have data) -->
    <div v-else>
      <!-- Unified Responsive Grid Layout -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <TransactionCard
          v-for="transaction in filteredTransactions"
          :key="transaction.id"
          :transaction="transaction"
        />
      </div>
    </div>

    <!-- Loading Sentinel / Spinner -->
    <div ref="observerTarget" class="py-6 flex justify-center w-full">
      <div
        v-if="$portfolio.loading"
        class="flex items-center justify-center gap-2 text-secondary text-sm"
      >
        <LoadingSpinner class="text-primary" />
        Loading more...
      </div>
      <div
        v-else-if="!$portfolio.hasMore && $portfolio.transactions.length > 0"
        class="text-xs text-secondary/50"
      >
        End of list
      </div>
    </div>
  </div>
</template>
