<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '@shared/lib/utils'

const props = defineProps<{
  totalIncome: number
  commonExpenses: number
  personalExpenses: number
  investmentTarget: number
  savingsTarget: number
  loading?: boolean
}>()

// Calculate segments for the bar (percentages relative to total income)
const segments = computed(() => {
  if (props.totalIncome <= 0) return { common: 0, personal: 0, investment: 0, savings: 0 }

  return {
    common: (props.commonExpenses / props.totalIncome) * 100,
    personal: (props.personalExpenses / props.totalIncome) * 100,
    investment: (props.investmentTarget / props.totalIncome) * 100,
    savings: (props.savingsTarget / props.totalIncome) * 100
  }
})
</script>

<template>
  <div class="space-y-3">
    <!-- The Bar -->
    <div
      class="h-12 w-full bg-surface-container-high rounded-xl overflow-hidden flex relative ring-1 ring-inset ring-black/5 dark:ring-white/5"
    >
      <div v-if="loading" class="w-full h-full animate-pulse bg-surface-container-high"></div>
      <template v-else>
        <!-- Common Expenses (Secondary) -->
        <div
          class="h-full bg-secondary transition-all duration-500 hover:brightness-110 flex items-center justify-center group relative border-r border-white/10"
          :style="{ width: `${segments.common}%` }"
        >
          <div
            class="opacity-0 group-hover:opacity-100 absolute -top-10 bg-inverse-surface text-inverse-on-surface text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity pointer-events-none"
          >
            Common: {{ formatCurrency(commonExpenses) }} ({{ Math.round(segments.common) }}%)
          </div>
        </div>

        <!-- Personal Expenses (Primary) -->
        <div
          class="h-full bg-primary transition-all duration-500 hover:brightness-110 flex items-center justify-center group relative border-r border-white/10"
          :style="{ width: `${segments.personal}%` }"
        >
          <div
            class="opacity-0 group-hover:opacity-100 absolute -top-10 bg-inverse-surface text-inverse-on-surface text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity pointer-events-none"
          >
            Personal: {{ formatCurrency(personalExpenses) }} ({{ Math.round(segments.personal) }}%)
          </div>
        </div>

        <!-- Investments (Tertiary) -->
        <div
          class="h-full bg-tertiary transition-all duration-500 hover:brightness-110 flex items-center justify-center group relative border-r border-white/10"
          :style="{ width: `${segments.investment}%` }"
        >
          <div
            class="opacity-0 group-hover:opacity-100 absolute -top-10 bg-inverse-surface text-inverse-on-surface text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity pointer-events-none"
          >
            Investments: {{ formatCurrency(investmentTarget) }} ({{
              Math.round(segments.investment)
            }}%)
          </div>
        </div>

        <!-- Savings (Success/Emerald) -->
        <div
          class="h-full bg-emerald-500 transition-all duration-500 hover:brightness-110 flex items-center justify-center group relative"
          :style="{ width: `${segments.savings}%` }"
        >
          <div
            class="opacity-0 group-hover:opacity-100 absolute -top-10 bg-inverse-surface text-inverse-on-surface text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity pointer-events-none"
          >
            Savings: {{ formatCurrency(savingsTarget) }} ({{ Math.round(segments.savings) }}%)
          </div>
        </div>
      </template>
    </div>

    <!-- Legend / Key -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
      <!-- Common -->
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-secondary"></div>
        <div class="flex flex-col">
          <span class="text-xs font-medium text-secondary">Common Exp.</span>
          <div class="flex items-baseline gap-1">
            <span class="text-sm font-bold text-on-surface">{{
              formatCurrency(commonExpenses)
            }}</span>
            <span class="text-xs font-medium text-secondary"
              >({{ Math.round(segments.common) }}%)</span
            >
          </div>
        </div>
      </div>
      <!-- Personal -->
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-primary"></div>
        <div class="flex flex-col">
          <span class="text-xs font-medium text-secondary">Personal Exp.</span>
          <div class="flex items-baseline gap-1">
            <span class="text-sm font-bold text-on-surface">{{
              formatCurrency(personalExpenses)
            }}</span>
            <span class="text-xs font-medium text-secondary"
              >({{ Math.round(segments.personal) }}%)</span
            >
          </div>
        </div>
      </div>
      <!-- Investments -->
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-tertiary"></div>
        <div class="flex flex-col">
          <span class="text-xs font-medium text-secondary">Investments</span>
          <div class="flex items-baseline gap-1">
            <span class="text-sm font-bold text-on-surface">{{
              formatCurrency(investmentTarget)
            }}</span>
            <span class="text-xs font-medium text-secondary"
              >({{ Math.round(segments.investment) }}%)</span
            >
          </div>
        </div>
      </div>
      <!-- Savings -->
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
        <div class="flex flex-col">
          <span class="text-xs font-medium text-secondary">Savings</span>
          <div class="flex items-baseline gap-1">
            <span class="text-sm font-bold text-on-surface">{{
              formatCurrency(savingsTarget)
            }}</span>
            <span class="text-xs font-medium text-secondary"
              >({{ Math.round(segments.savings) }}%)</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
