<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from '@nanostores/vue'
import { portfolioStore } from '@shared/stores/portfolioStore'
import { formatCurrency, formatDate } from '@shared/lib/utils'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@shared/lib/firebase'
import { user } from '@features/auth/stores/authStore'
import type { TransactionModel, AssetModel } from '@shared/types'
import { TransactionTypes } from '@shared/types'
import FilterCard from '@shared/components/FilterCard.vue'
import FilterSelect, { type FilterOption } from '@shared/components/FilterSelect.vue'
import LoadingSpinner from '@shared/components/icons/LoadingSpinner.vue'
import AssetCard from './AssetCard.vue'

const $portfolio = useStore(portfolioStore)
const $user = useStore(user)
const searchQuery = ref('')
const selectedType = ref('')
const selectedPlatform = ref('')
const showArchived = ref(false)
const allTransactions = ref<TransactionModel[]>([])

const filteredAssets = computed(() => {
  if (!$portfolio.value.assets) return []
  let result = $portfolio.value.assets

  // Apply type filter
  if (selectedType.value) {
    result = result.filter((asset) => asset.type === selectedType.value)
  }

  // Apply platform filter
  if (selectedPlatform.value) {
    result = result.filter((asset) => asset.platformId === selectedPlatform.value)
  }

  // Apply search filter
  if (searchQuery.value) {
    result = result.filter(
      (asset) =>
        asset.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        asset.id.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  return result
})

// Separate active and archived assets
const activeAssets = computed(() => {
  return filteredAssets.value
    .filter((asset) => getInvested(asset.id) > 0 && !asset.isArchived)
    .sort((a, b) => getInvested(b.id) - getInvested(a.id)) // Sort by invested amount (descending)
})

const archivedAssets = computed(() => {
  return filteredAssets.value.filter((asset) => getInvested(asset.id) === 0 || asset.isArchived)
})

// Load all transactions on mount for accurate calculations
import { watch } from 'vue'

const loadAllTransactions = async () => {
  if (!$user.value) return

  try {
    const txSnapshot = await getDocs(collection(db, 'users', $user.value.uid, 'transactions'))
    allTransactions.value = txSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data()
        }) as TransactionModel
    )
    console.log(`Loaded ${allTransactions.value.length} transactions for asset calculations`)
  } catch (error) {
    console.error('Error loading all transactions:', error)
  }
}

// Watch for user to be available, then load transactions
watch(
  $user,
  (newUser) => {
    if (newUser && allTransactions.value.length === 0) {
      loadAllTransactions()
    }
  },
  { immediate: true }
)


const getInvested = (assetId: string) => {
  if (allTransactions.value.length === 0) return 0

  const matchingTransactions = allTransactions.value.filter((tx) => {
    return tx.assetId === assetId && TransactionTypes.includes(tx.type as typeof TransactionTypes[number])
  })

  return matchingTransactions.reduce((sum, tx) => sum + tx.amount, 0)
}

const getProfit = (asset: AssetModel) => {
  const invested = getInvested(asset.id)
  return asset.currentValue - invested
}

const getRoiPercent = (asset: AssetModel) => {
  const invested = getInvested(asset.id)
  if (invested === 0) return 0
  const profit = asset.currentValue - invested
  return (profit / invested) * 100
}

const getPlatformName = (platformId: string) => {
  if (!$portfolio.value.platforms) return platformId
  const platform = $portfolio.value.platforms.find((p) => p.id === platformId)
  return platform ? platform.name : platformId
}

// Get unique asset types and their counts
const assetTypes = computed(() => {
  if (!$portfolio.value.assets) return []
  const types = new Set($portfolio.value.assets.map((asset) => asset.type))
  return Array.from(types).sort()
})

const typeCounts = computed(() => {
  const counts: Record<string, number> = {}
  $portfolio.value.assets.forEach((asset) => {
    counts[asset.type] = (counts[asset.type] || 0) + 1
  })
  return counts
})

// Platform counts
const platformCounts = computed(() => {
  const counts: Record<string, number> = {}
  $portfolio.value.assets.forEach((asset) => {
    if (asset.platformId) {
      counts[asset.platformId] = (counts[asset.platformId] || 0) + 1
    }
  })
  return counts
})

// Prepare options for FilterSelect components
const typeOptions = computed<FilterOption[]>(() => {
  return assetTypes.value.map(type => ({
    value: type,
    label: type,
    count: typeCounts.value[type] || 0
  }))
})

const platformOptions = computed<FilterOption[]>(() => {
  return $portfolio.value.platforms.map(platform => ({
    value: platform.id,
    label: platform.name,
    count: platformCounts.value[platform.id] || 0
  }))
})

// Archive/Unarchive functions
import { doc, updateDoc } from 'firebase/firestore'

const toggleArchive = async (asset: AssetModel) => {
  if (!$user.value) return

  try {
    const assetRef = doc(db, 'users', $user.value.uid, 'assets', asset.id)
    await updateDoc(assetRef, {
      isArchived: !asset.isArchived
    })
  } catch (error) {
    console.error('Error toggling archive status:', error)
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedType.value = ''
  selectedPlatform.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <!-- Search and Filters -->
    <FilterCard v-model:search-query="searchQuery" :result-count="filteredAssets.length"
      search-placeholder="Search assets..." @clear="clearFilters"
    >
      <template #filters>
        <!-- Type Filter -->
        <FilterSelect id="type-filter" v-model="selectedType" label="Type" :options="typeOptions"
          all-label="All Types" />

        <!-- Platform Filter -->
        <FilterSelect id="platform-filter" v-model="selectedPlatform" label="Platform" :options="platformOptions"
          all-label="All Platforms" />
      </template>
    </FilterCard>

    <!-- Loading State -->
    <div v-if="$portfolio.loading" class="text-center py-10">
      <LoadingSpinner size="lg" class="text-primary mx-auto" />
      <p class="mt-2 text-sm text-secondary">Loading assets...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="activeAssets.length === 0 && archivedAssets.length === 0"
      class="text-center py-10 text-secondary"
    >
      No assets found.
    </div>

    <!-- Active Assets Grid -->
    <div v-else>
      <div
        v-if="activeAssets.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AssetCard
          v-for="asset in activeAssets"
          :key="asset.id"
:asset="asset" :on-archive="toggleArchive" />
      </div>

      <!-- Archived Assets Section -->
      <div v-if="archivedAssets.length > 0" class="mt-8">
        <!-- Collapsible Header -->
        <button
          class="w-full flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant rounded-xl hover:bg-surface-container transition-colors mb-4"
          @click="showArchived = !showArchived"
        >
          <div class="flex items-center gap-3">
            <svg
              class="w-5 h-5 text-secondary transition-transform"
              :class="{ 'rotate-90': showArchived }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
            <h2 class="text-lg font-semibold text-on-surface">Archivados</h2>
            <span
              class="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary-container text-on-secondary-container"
            >
              {{ archivedAssets.length }}
            </span>
          </div>
          <p class="text-sm text-secondary">Assets sin inversión</p>
        </button>

        <!-- Archived Assets Grid (Collapsible) -->
        <div
          v-show="showArchived"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75"
        >
          <AssetCard
            v-for="asset in archivedAssets"
            :key="asset.id"
            :asset="asset"
            :on-archive="toggleArchive"
          />
        </div>
      </div>
    </div>
  </div>
</template>
