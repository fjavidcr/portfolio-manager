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

const formatDate = (date: Date | Timestamp | null) => {
  if (!date) return ''
  if ('toDate' in date && typeof date.toDate === 'function') {
    return date.toDate().toLocaleDateString()
  }
  return (date as Date).toLocaleDateString()
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
    class="bg-surface-container-low rounded-xl border border-outline-variant p-3 sm:p-4 hover:bg-surface-container transition-colors shadow-sm group flex flex-col sm:flex-row items-start sm:items-center gap-4"
  >
    <!-- Left: Icon & Type -->
    <div class="flex items-center gap-3 shrink-0">
      <div
        class="p-2.5 rounded-xl flex items-center justify-center"
        :class="getActionStyle(transaction.type).iconBg"
      >
        <TransactionIcon :type="transaction.type" size="md" />
      </div>
      <div class="flex flex-col">
        <span
          class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider w-fit"
          :class="[getActionStyle(transaction.type).bg, getActionStyle(transaction.type).text]"
        >
          {{ transaction.type }}
        </span>
        <span class="text-xs text-secondary mt-0.5">{{ formatDate(transaction.date) }}</span>
      </div>
    </div>

    <!-- Center: Asset & Description -->
    <div class="flex-1 min-w-0">
      <h3 class="text-base font-bold text-on-surface truncate" :title="getAssetName(transaction.assetId)">
        {{ getAssetName(transaction.assetId) }}
      </h3>
      <p v-if="transaction.description" class="text-xs text-secondary/70 truncate mt-0.5">
        {{ transaction.description }}
      </p>
    </div>

    <!-- Right: Amount & Edit -->
    <div class="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
      <div class="text-right">
        <p class="text-lg font-bold tracking-tight" :class="getActionStyle(transaction.type).text">
          {{ formatCurrency(transaction.amount) }}
        </p>
      </div>

      <a
        :href="`/edit-transaction?id=${transaction.id}`"
        class="p-2 rounded-full bg-surface-container-highest/30 text-secondary hover:text-primary hover:bg-surface-container-highest transition-all sm:opacity-0 sm:group-hover:opacity-100"
        title="Edit Transaction"
      >
        <EditIcon size="sm" />
      </a>
    </div>
  </div>
</template>
