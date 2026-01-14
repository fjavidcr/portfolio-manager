<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { portfolioStore, fetchTransactions, setFilters } from '@shared/stores/portfolioStore'
import { TransactionTypes } from '@shared/types'
import { watch, onMounted, ref, onUnmounted, computed } from 'vue'
import TransactionCard from './TransactionCard.vue'

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
</script>

<template>
  <div class="space-y-6">
    <!-- Search and Filters -->
    <div
      class="sticky top-4 z-20 bg-surface-container-low shadow-lg rounded-2xl border border-outline-variant p-6 mb-6 backdrop-blur-sm"
    >
      <!-- Search Bar -->
      <div class="mb-4">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              class="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search transactions..."
            class="block w-full pl-10 pr-3 py-3 bg-surface border border-outline-variant rounded-full text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
          />
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Type Filter -->
        <div>
          <label for="type-filter" class="block text-xs font-medium text-secondary mb-2"
            >Type</label
          >
          <select
            id="type-filter"
            v-model="selectedType"
            class="block w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
          >
            <option value="">All Types</option>
            <option v-for="type in TransactionTypes" :key="type" :value="type">
              {{ type }} ({{ typeCounts[type] || 0 }})
            </option>
          </select>
        </div>

        <!-- Asset Filter -->
        <div>
          <label for="asset-filter" class="block text-xs font-medium text-secondary mb-2"
            >Asset</label
          >
          <select
            id="asset-filter"
            v-model="selectedAsset"
            class="block w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
          >
            <option value="">All Assets</option>
            <option v-for="asset in $portfolio.assets" :key="asset.id" :value="asset.id">
              {{ asset.name }} ({{ asset.id }})
            </option>
          </select>
        </div>

        <!-- Clear Filters Button -->
        <div class="flex items-end">
          <button
            class="w-full px-4 py-2 bg-surface-container-high hover:bg-surface-container transition-colors text-on-surface rounded-lg text-sm font-medium border border-outline-variant"
            @click="
              searchQuery = ''
              selectedType = ''
              selectedAsset = ''
            "
          >
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Results Count Footer -->
      <div class="mt-4 pt-4 flex justify-between items-center text-sm text-secondary">
        <span>Showing {{ filteredTransactions.length }} results</span>
      </div>
    </div>

    <!-- Initial Loading State (Only when empty) -->
    <div
      v-if="$portfolio.loading && $portfolio.transactions.length === 0"
      class="text-center py-10"
    >
      <svg
        class="animate-spin h-8 w-8 text-primary mx-auto"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
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
        <svg
          class="animate-spin h-5 w-5 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
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
