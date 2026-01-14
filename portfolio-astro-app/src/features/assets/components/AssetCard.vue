<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { portfolioStore } from '@shared/stores/portfolioStore'
import { formatCurrency, formatDate } from '@shared/lib/utils'
import type { AssetModel } from '@shared/types'
import EditIcon from '@shared/components/icons/EditIcon.vue'

interface Props {
  asset: AssetModel
  onArchive?: (asset: AssetModel) => void
}

const props = defineProps<Props>()
const $portfolio = useStore(portfolioStore)

const getPlatformName = (platformId: string) => {
  const platform = $portfolio.value.platforms.find((p) => p.id === platformId)
  return platform ? platform.name : platformId
}

const getInvested = (assetId: string) => {
  const inflows = ['Plan', 'Aportación', 'Dividendo', 'Traspaso']
  const outflows = ['Retirada', 'Venta']

  const invested = $portfolio.value.transactions
    .filter((t) => t.assetId === assetId)
    .reduce((sum, t) => {
      if (inflows.includes(t.type)) return sum + t.amount
      if (outflows.includes(t.type)) return sum - t.amount
      return sum
    }, 0)

  return invested
}

const getProfit = (asset: AssetModel) => {
  return asset.currentValue - getInvested(asset.id)
}

const getRoiPercent = (asset: AssetModel) => {
  const invested = getInvested(asset.id)
  if (invested === 0) return 0
  return ((asset.currentValue - invested) / invested) * 100
}
</script>

<template>
  <div
    class="bg-surface-container-low border border-outline-variant rounded-xl p-5 hover:bg-surface-container transition-colors shadow-sm flex flex-col justify-between group"
  >
    <!-- Header -->
    <div class="flex justify-between items-start mb-4">
      <div class="min-w-0 flex-1 mr-2">
        <h3 class="text-lg font-semibold text-on-surface truncate" :title="asset.name">
          {{ asset.name }}
        </h3>
        <p
          class="text-xs text-secondary font-medium tracking-wide truncate"
          :title="asset.id"
        >
          {{ asset.id }}
        </p>
        <div class="mt-2 flex gap-2 flex-wrap">
          <span
            v-if="asset.platformId"
            class="px-2 py-0.5 inline-flex text-[10px] font-semibold rounded-full bg-tertiary-container text-on-tertiary-container truncate max-w-full"
            :title="getPlatformName(asset.platformId)"
          >
            {{ getPlatformName(asset.platformId) }}
          </span>
          <span
            class="px-2 py-0.5 inline-flex text-[10px] font-semibold rounded-full bg-secondary-container text-on-secondary-container truncate max-w-full"
          >
            {{ asset.type }}
          </span>
          <span
            v-if="asset.description"
            class="px-2 py-0.5 inline-flex text-[10px] font-medium text-gray-400 border border-outline-variant rounded-full truncate max-w-full"
            :title="asset.description"
          >
            {{ asset.description }}
          </span>
        </div>
      </div>
      <div class="flex gap-1">
        <button
          v-if="onArchive"
          class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-surface-container/50 rounded-full transition-colors flex-shrink-0"
          title="Archivar"
          @click="onArchive(asset)"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            ></path>
          </svg>
        </button>
        <a
          :href="`/edit-asset?id=${asset.id}`"
          class="p-2 text-primary hover:bg-primary-container/20 rounded-full transition-colors flex-shrink-0"
          title="Editar"
        >
          <EditIcon size="md" />
        </a>
      </div>
    </div>

    <!-- Main Value -->
    <div class="mb-4">
      <p class="text-xs text-secondary uppercase tracking-widest font-bold">Valor Actual</p>
      <p class="text-3xl font-bold text-on-surface tracking-tight">
        {{ formatCurrency(asset.currentValue) }}
      </p>
    </div>

    <!-- Metrics Grid -->
    <div
      class="grid grid-cols-2 gap-y-3 gap-x-2 border-t border-outline-variant pt-3 text-sm"
    >
      <!-- Invested -->
      <div>
        <p class="text-[10px] text-secondary uppercase font-bold">Invertido</p>
        <p class="font-medium text-on-surface/80">
          {{ formatCurrency(getInvested(asset.id)) }}
        </p>
      </div>

      <!-- Last Update -->
      <div class="text-right">
        <p class="text-[10px] text-secondary uppercase font-bold">Actualizado</p>
        <p class="font-medium text-on-surface/60">{{ formatDate(asset.lastUpdated) }}</p>
      </div>

      <!-- ROI € -->
      <div>
        <p class="text-[10px] text-secondary uppercase font-bold">ROI €</p>
        <p
          class="font-bold"
          :class="
            getProfit(asset) >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          "
        >
          {{ (getProfit(asset) >= 0 ? '+' : '') + formatCurrency(getProfit(asset)) }}
        </p>
      </div>

      <!-- ROI % -->
      <div class="text-right">
        <p class="text-[10px] text-secondary uppercase font-bold">ROI %</p>
        <p
          class="font-bold"
          :class="
            getRoiPercent(asset) >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          "
        >
          {{ (getRoiPercent(asset) >= 0 ? '+' : '') + getRoiPercent(asset).toFixed(2) }}%
        </p>
      </div>
    </div>
  </div>
</template>
