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

// Import cached formatter
import { formatDefaultDate } from '@shared/lib/utils'

const formatDate = (date: Date | Timestamp | null) => {
  if (!date) return ''
  let jsDate: Date
  if ('toDate' in date && typeof date.toDate === 'function') {
    jsDate = date.toDate()
  } else {
    jsDate = date as Date
  }
  if (isNaN(jsDate.getTime())) return ''
  return formatDefaultDate(jsDate)
}

const getAssetName = (assetId: string) => {
  if (!assetId) return 'Unknown Asset'
  const asset = $portfolio.value.assets.find((a: AssetModel) => a.id === assetId)
  return asset ? asset.name : assetId
}

// Distinct Colors for each type
const getActionStyle = (type: string) => {
  switch (type) {
    case 'Venta':
      return {
        bg: 'tx-emerald-bg',
        text: 'tx-emerald-text',
        border: 'tx-emerald-border',
        iconBg: 'tx-emerald-icon'
      }
    case 'Dividendo':
      return {
        bg: 'tx-amber-bg',
        text: 'tx-amber-text',
        border: 'tx-amber-border',
        iconBg: 'tx-amber-icon'
      }
    case 'Aportación':
      return {
        bg: 'tx-blue-bg',
        text: 'tx-blue-text',
        border: 'tx-blue-border',
        iconBg: 'tx-blue-icon'
      }
    case 'Retirada':
      return {
        bg: 'tx-orange-bg',
        text: 'tx-orange-text',
        border: 'tx-orange-border',
        iconBg: 'tx-orange-icon'
      }
    case 'Traspaso':
      return {
        bg: 'tx-slate-bg',
        text: 'tx-slate-text',
        border: 'tx-slate-border',
        iconBg: 'tx-slate-icon'
      }
    case 'Plan':
      return {
        bg: 'tx-indigo-bg',
        text: 'tx-indigo-text',
        border: 'tx-indigo-border',
        iconBg: 'tx-indigo-icon'
      }
    default:
      return {
        bg: 'bg-primary-container dark:bg-primary-container/20',
        text: 'text-on-primary-container dark:text-on-primary-container',
        border: 'border-primary-container dark:border-primary-container/20',
        iconBg: 'bg-primary-container text-on-primary-container dark:bg-primary-container/20'
      }
  }
}
</script>

<template>
  <div
    class="bg-surface-container-low rounded-2xl border border-outline-variant p-3 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
  >
    <!-- Decorative Top Border based on type -->
    <div
      class="absolute top-0 left-0 right-0 h-1"
      :class="getActionStyle(transaction.type).bg"
    ></div>

    <!-- Discrete Edit Button (Absolute Top Right - smaller & tighter) -->
    <a
      :href="`/edit-transaction?id=${transaction.id}`"
      class="absolute top-2 right-2 p-1.5 rounded-full bg-surface-container-highest/50 text-secondary hover:text-primary hover:bg-surface-container-highest transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
      title="Edit Transaction"
    >
      <EditIcon size="sm" />
    </a>

    <!-- Header: Type, Date & Amount -->
    <div class="flex justify-between items-center pt-1 px-1 gap-2">
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <div
          class="p-2 rounded-lg flex items-center justify-center shrink-0"
          :class="getActionStyle(transaction.type).iconBg"
        >
          <TransactionIcon :type="transaction.type" />
        </div>

        <div class="min-w-0 flex-1 flex flex-col justify-center">
          <!-- Type Badge -->
          <span
            class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider w-fit mb-0.5"
            :class="[getActionStyle(transaction.type).bg, getActionStyle(transaction.type).text]"
          >
            {{ transaction.type }}
          </span>
          <!-- Date (Subtle) -->
          <p
            class="text-[10px] text-secondary dark:text-gray-400 font-medium truncate leading-none"
          >
            {{ formatDate(transaction.date) }}
          </p>
        </div>
      </div>

      <!-- Amount -->
      <div class="text-right shrink-0">
        <p
          class="text-base font-bold tracking-tight"
          :class="getActionStyle(transaction.type).text"
        >
          {{ formatCurrency(transaction.amount) }}
        </p>
      </div>
    </div>

    <!-- Asset Name (Prominent, Full Width) -->
    <div class="px-2 pb-1">
      <h3
        class="text-lg font-bold text-on-surface leading-tight truncate"
        :title="getAssetName(transaction.assetId)"
      >
        {{ getAssetName(transaction.assetId) }}
      </h3>
      <p
        v-if="transaction.description"
        class="text-[10px] text-secondary/60 dark:text-gray-500 mt-0.5"
      >
        {{ transaction.description }}
      </p>
    </div>
  </div>
</template>
