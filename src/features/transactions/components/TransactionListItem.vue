<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { portfolioStore } from '@shared/stores/portfolioStore'
import { formatCurrency } from '@shared/lib/utils'
import type { TransactionModel, AssetModel } from '@shared/types'
import type { Timestamp } from 'firebase/firestore'
import EditIcon from '@shared/components/icons/EditIcon.vue'
import TransactionIcon from '@shared/components/icons/TransactionIcon.vue'

defineProps<{
  transaction: TransactionModel
}>()

const $portfolio = useStore(portfolioStore)

const toJSDate = (date: Date | Timestamp | null): Date | null => {
  if (!date) return null
  if ('toDate' in date && typeof date.toDate === 'function') {
    return date.toDate()
  }
  return date as Date
}

const getAssetName = (assetId: string) => {
  if (!assetId) return 'Unknown Asset'
  const asset = $portfolio.value.assets.find((a: AssetModel) => a.id === assetId)
  return asset ? asset.name : assetId
}

const getActionStyle = (type: string) => {
  switch (type) {
    case 'Venta':
      return {
        bg: 'tx-emerald-bg',
        text: 'tx-emerald-text',
        iconBg: 'tx-emerald-icon'
      }
    case 'Dividendo':
      return {
        bg: 'tx-amber-bg',
        text: 'tx-amber-text',
        iconBg: 'tx-amber-icon'
      }
    case 'Aportación':
      return {
        bg: 'tx-blue-bg',
        text: 'tx-blue-text',
        iconBg: 'tx-blue-icon'
      }
    case 'Retirada':
      return {
        bg: 'tx-orange-bg',
        text: 'tx-orange-text',
        iconBg: 'tx-orange-icon'
      }
    case 'Traspaso':
      return {
        bg: 'tx-slate-bg',
        text: 'tx-slate-text',
        iconBg: 'tx-slate-icon'
      }
    case 'Plan':
      return {
        bg: 'tx-indigo-bg',
        text: 'tx-indigo-text',
        iconBg: 'tx-indigo-icon'
      }
    default:
      return {
        bg: 'bg-primary-container dark:bg-primary-container/20',
        text: 'text-on-primary-container dark:text-on-primary-container',
        iconBg: 'bg-primary-container text-on-primary-container dark:bg-primary-container/20'
      }
  }
}
</script>

<template>
  <div
    class="bg-surface-container-low rounded-xl border border-outline-variant p-3 sm:p-4 hover:bg-surface-container transition-colors shadow-sm group flex items-center justify-between gap-3 sm:gap-4 relative overflow-hidden"
  >
    <!-- Left side wrapper (Date + Icon) -->
    <div class="flex items-center gap-3 shrink-0">
      <!-- Date Highlight (Hidden on very small screens, visible on sm+) -->
      <div
        class="hidden sm:flex shrink-0 flex-col items-center justify-center bg-surface-container-high rounded-xl p-2 min-w-[70px] border border-outline-variant/50"
      >
        <span
          class="text-[10px] uppercase font-bold text-secondary tracking-widest leading-none mb-1"
        >
          {{ toJSDate(transaction.date)?.toLocaleString('default', { month: 'short' }) }}
        </span>
        <span class="text-xl font-black text-on-surface leading-none">
          {{ toJSDate(transaction.date)?.getDate() }}
        </span>
        <span class="text-[10px] font-medium text-secondary/60 mt-1">
          {{ toJSDate(transaction.date)?.getFullYear() }}
        </span>
      </div>

      <!-- Icon -->
      <div class="flex items-center gap-3 shrink-0">
        <div
          class="p-2 sm:p-2.5 rounded-xl flex items-center justify-center shrink-0"
          :class="getActionStyle(transaction.type).iconBg"
        >
          <TransactionIcon :type="transaction.type" size="md" />
        </div>
      </div>
    </div>

    <!-- Center: Asset & Description & Type badge -->
    <div class="flex-1 min-w-0 pr-2">
      <div class="flex items-center gap-2 mb-0.5">
        <span
          class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0"
          :class="[getActionStyle(transaction.type).bg, getActionStyle(transaction.type).text]"
        >
          {{ transaction.type }}
        </span>
        <span class="sm:hidden text-[10px] text-secondary font-medium tracking-wide">
          {{ toJSDate(transaction.date)?.toLocaleDateString() }}
        </span>
      </div>
      <h3
        class="text-sm sm:text-base font-bold text-on-surface truncate leading-tight"
        :title="getAssetName(transaction.assetId)"
      >
        {{ getAssetName(transaction.assetId) }}
      </h3>
      <p
        v-if="transaction.description"
        class="text-[10px] sm:text-xs text-secondary/70 truncate mt-0.5"
      >
        {{ transaction.description }}
      </p>
    </div>

    <!-- Right: Amount & Edit -->
    <div
      class="flex flex-col items-end sm:flex-row sm:items-center justify-end gap-2 sm:gap-6 shrink-0 relative"
    >
      <div class="text-right">
        <p
          class="text-base sm:text-lg font-bold tracking-tight"
          :class="getActionStyle(transaction.type).text"
        >
          {{ formatCurrency(transaction.amount) }}
        </p>
      </div>

      <a
        :href="`/edit-transaction?id=${transaction.id}`"
        class="hidden sm:block p-1.5 sm:p-2 rounded-full box-content bg-surface-container-highest/30 text-secondary hover:text-primary hover:bg-surface-container-highest transition-all sm:opacity-0 sm:group-hover:opacity-100"
        title="Edit Transaction"
      >
        <EditIcon size="sm" />
      </a>
    </div>

    <!-- Mobile Edit Button (Absolute) -->
    <a
      :href="`/edit-transaction?id=${transaction.id}`"
      class="sm:hidden absolute top-2 right-2 p-1 rounded-full bg-surface-container-highest/30 text-secondary hover:text-primary hover:bg-surface-container-highest transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
      title="Edit Transaction"
    >
      <EditIcon size="sm" />
    </a>
  </div>
</template>
