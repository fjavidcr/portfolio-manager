<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { dcaStore, dcaStatus, dcaItemsWithAssets, totalDcaEuros } from '../stores/dcaStore'
import { budgetStore, budgetStatus } from '@features/budget/stores/budgetStore'
import { computed } from 'vue'
import { formatCurrency, formatUsd } from '@shared/lib/utils'
import SummarySkeleton from './skeletons/SummarySkeleton.vue'

const dca = useStore(dcaStore)
const dcaState = useStore(dcaStatus)
const budget = useStore(budgetStore)
const budgetState = useStore(budgetStatus)
const isLoading = computed(() => dcaState.value.loading || budgetState.value.loading)

const totalPlanned = useStore(totalDcaEuros)
const itemsWithAssets = useStore(dcaItemsWithAssets)

const investmentTarget = computed(() => budget.value.savingsParams.investmentTarget)
const remainingBudget = computed(() => investmentTarget.value - totalPlanned.value)

const calculateMonthly = (goalId: string, percentage: number) => {
  const goal = dca.value.goals.find((g) => g.id === goalId)
  if (!goal) return 0
  return (goal.euros * percentage) / 100
}

const totalAllocatedEur = computed(() => {
  return itemsWithAssets.value.reduce(
    (sum, item) => sum + calculateMonthly(item.goalId, item.percentage),
    0
  )
})

// Mock exchange rate for demo
const EUR_USD = 1.09
const totalPlannedUsd = computed(() => totalPlanned.value * EUR_USD)
</script>

<template>
  <div class="bg-surface rounded-3xl p-6 md:p-8 border border-outline-variant/30">
    <div class="flex flex-col space-y-8">
      <!-- Header & Total -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 class="text-xl font-bold text-on-surface">Resumen de Planificación</h2>
          <p class="text-sm text-secondary tracking-tight">Vinculado a tu presupuesto mensual</p>
        </div>
        <div class="text-right flex flex-col items-end">
          <p class="text-[10px] uppercase tracking-widest text-secondary font-bold mb-1">
            Total Planificado
          </p>
          <div v-if="isLoading" class="skeleton h-10 w-40 opacity-30 rounded-lg"></div>
          <template v-else>
            <h3 class="text-4xl font-black text-on-surface">
              {{ formatCurrency(totalPlanned) }}
            </h3>
            <p class="text-xs font-bold text-secondary/60 mt-1">
              ≈
              {{ formatUsd(totalPlannedUsd) }}
            </p>
          </template>
        </div>
      </div>

      <!-- Stats Grid -->
      <SummarySkeleton v-if="isLoading" />
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/50">
          <span class="text-[10px] font-black uppercase text-secondary tracking-widest block mb-2"
            >Presupuesto (Budget)</span
          >
          <div class="text-xl font-bold text-on-surface">
            {{ formatCurrency(investmentTarget) }}
          </div>
        </div>

        <div class="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/50">
          <span class="text-[10px] font-black uppercase text-secondary tracking-widest block mb-2"
            >Por Asignar</span
          >
          <div
            class="text-xl font-bold"
            :class="remainingBudget < 0 ? 'text-error' : 'text-on-surface'"
          >
            {{ formatCurrency(remainingBudget) }}
          </div>
        </div>

        <div class="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/50">
          <span class="text-[10px] font-black uppercase text-secondary tracking-widest block mb-2"
            >Ejecución DCA</span
          >
          <div class="text-xl font-bold text-on-surface">
            {{ formatCurrency(totalAllocatedEur) }}
          </div>
        </div>

        <div
          class="p-5 rounded-2xl border transition-colors"
          :class="
            Math.abs(remainingBudget) < 1
              ? 'bg-primary/5 border-primary/20'
              : 'bg-surface-container-low border-outline-variant/50'
          "
        >
          <span
            class="text-[10px] font-black uppercase tracking-widest block mb-2"
            :class="Math.abs(remainingBudget) < 1 ? 'text-primary' : 'text-secondary'"
            >Alineación</span
          >
          <div
            class="text-xl font-bold"
            :class="Math.abs(remainingBudget) < 1 ? 'text-primary' : 'text-on-surface'"
          >
            {{ Math.round((totalPlanned / (investmentTarget || 1)) * 100) }}%
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
