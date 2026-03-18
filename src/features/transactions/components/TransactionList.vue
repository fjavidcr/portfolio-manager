<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { portfolioStore, fetchTransactions, setFilters } from '@shared/stores/portfolioStore'
import { TransactionTypes, type TransactionModel } from '@shared/types'
import { type Timestamp } from 'firebase/firestore'
import { watch, onMounted, ref, onUnmounted, computed } from 'vue'
import { formatMonthYear } from '@shared/lib/utils'
import TransactionCard from './TransactionCard.vue'
import FilterCard from '@shared/components/FilterCard.vue'
import FilterSelect, { type FilterOption } from '@shared/components/FilterSelect.vue'
import LoadingSpinner from '@shared/components/icons/LoadingSpinner.vue'
import GridIcon from '@shared/components/icons/GridIcon.vue'
import ListIcon from '@shared/components/icons/ListIcon.vue'
import TransactionListItem from './TransactionListItem.vue'

const $portfolio = useStore(portfolioStore)
const observerTarget = ref<HTMLElement | null>(null)

const toJSDate = (date: Date | Timestamp | null): Date => {
  if (!date) return new Date()
  if ('toDate' in date && typeof date.toDate === 'function') {
    return date.toDate()
  }
  return date as Date
}

const searchQuery = ref('')
const selectedType = ref('')
const selectedAsset = ref('')

// View Mode (Grid vs List)
const viewMode = ref<'grid' | 'list'>('grid')

onMounted(() => {
  const savedMode = localStorage.getItem('transaction_view_mode')
  if (savedMode === 'list' || savedMode === 'grid') {
    viewMode.value = savedMode
  }
})

const setViewMode = (mode: 'grid' | 'list') => {
  viewMode.value = mode
  localStorage.setItem('transaction_view_mode', mode)
}

// Watch filters to ensure we have all data loaded
// Watch filters and trigger server-side fetch
watch([selectedType, selectedAsset], ([type, asset]) => {
  setFilters({
    type: type,
    assetId: asset
  })
})

// Pre-calculate asset names map to optimize search O(N*M) -> O(N+M)
const assetMap = computed(() => {
  return $portfolio.value.assets.reduce(
    (acc, asset) => {
      acc[asset.id] = asset.name
      return acc
    },
    {} as Record<string, string>
  )
})

// Filtered Transactions
const filteredTransactions = computed(() => {
  let result = $portfolio.value.transactions

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    const assets = assetMap.value
    result = result.filter((tx) => {
      const assetName = assets[tx.assetId] || ''
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

// Grouped Transactions for List View
const groupedTransactions = computed(() => {
  const groups: Record<string, TransactionModel[]> = {}

  filteredTransactions.value.forEach((tx) => {
    const date = toJSDate(tx.date)
    const monthYear = formatMonthYear(date)
    if (!groups[monthYear]) {
      groups[monthYear] = []
    }
    groups[monthYear].push(tx)
  })

  // Sort months chronologically (most recent first)
  return Object.entries(groups).sort((a, b) => {
    const dateA = toJSDate(a[1][0].date)
    const dateB = toJSDate(b[1][0].date)
    return dateB.getTime() - dateA.getTime()
  })
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
  return TransactionTypes.map((type) => ({
    value: type,
    label: type,
    count: typeCounts.value[type] || 0
  }))
})

const assetFilterOptions = computed<FilterOption[]>(() => {
  return $portfolio.value.assets.map((asset) => ({
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
    <FilterCard
      v-model:search-query="searchQuery"
      :result-count="filteredTransactions.length"
      search-placeholder="Search transactions..."
      @clear="clearFilters"
    >
      <template #filters>
        <!-- Type Filter -->
        <FilterSelect
          id="type-filter"
          v-model="selectedType"
          label="Type"
          :options="typeFilterOptions"
          all-label="All Types"
        />

        <!-- Asset Filter -->
        <FilterSelect
          id="asset-filter"
          v-model="selectedAsset"
          label="Asset"
          :options="assetFilterOptions"
          all-label="All Assets"
        />
      </template>
      <template #actions>
        <div
          class="flex bg-surface-container rounded-lg p-1 border border-outline-variant shadow-inner"
        >
          <button
            class="p-1.5 rounded-md transition-all duration-200"
            :class="
              viewMode === 'grid'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-secondary hover:text-on-surface'
            "
            title="Grid View"
            @click="setViewMode('grid')"
          >
            <GridIcon />
          </button>
          <button
            class="p-1.5 rounded-md transition-all duration-200"
            :class="
              viewMode === 'list'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-secondary hover:text-on-surface'
            "
            title="List View"
            @click="setViewMode('list')"
          >
            <ListIcon />
          </button>
        </div>
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
      <svg class="h-5 w-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <!-- Transaction List (Always show if we have data) -->
    <div v-else class="space-y-10">
      <div
        v-for="[monthYear, transactions] in groupedTransactions"
        :key="monthYear"
        class="space-y-4"
      >
        <!-- Month Header -->
        <div class="flex items-center gap-4">
          <h2 class="text-sm font-bold uppercase tracking-[0.2em] text-secondary/60">
            {{ monthYear }}
          </h2>
          <div class="h-px bg-outline-variant/30 flex-1"></div>
        </div>

        <!-- Content -->
        <div>
          <!-- Grid Mode -->
          <div
            v-if="viewMode === 'grid'"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <TransactionCard
              v-for="transaction in transactions"
              :key="transaction.id"
              :transaction="transaction"
            />
          </div>

          <!-- List Mode -->
          <div v-else class="flex flex-col gap-3">
            <TransactionListItem
              v-for="transaction in transactions"
              :key="transaction.id"
              :transaction="transaction"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Sentinel / Spinner -->
    <div ref="observerTarget" class="py-6 flex justify-center w-full">
      <div
        v-if="$portfolio.loading"
        class="flex items-center justify-center gap-2 text-secondary text-sm"
      >
        <LoadingSpinner class="text-primary shrink-0" />
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
