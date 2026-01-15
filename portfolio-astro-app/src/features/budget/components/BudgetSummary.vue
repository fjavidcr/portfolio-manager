<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  totalIncome: number
  totalExpenses: number
  investmentTarget: number
  savingsTarget: number
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:investmentTarget', val: number): void
  (e: 'update:savingsTarget', val: number): void
}>()

const remaining = computed(() => props.totalIncome - props.totalExpenses)
const unallocated = computed(() => remaining.value - props.investmentTarget - props.savingsTarget)

const formatCurrency = (val: number) => {
  return val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

const expensePercent = computed(() =>
  props.totalIncome > 0 ? (props.totalExpenses / props.totalIncome) * 100 : 0
)
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    <!-- Big Totals Card -->
    <div
      class="bg-primary-container text-on-primary-container rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden"
    >
      <!-- Decorative circles -->
      <div class="absolute -right-12 -top-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>

      <div>
        <p class="text-sm font-medium opacity-80 uppercase tracking-wider mb-1">
          Monthly Remaining
        </p>
        <div v-if="loading" class="h-12 w-48 bg-white/20 animate-pulse rounded-lg"></div>
        <h2 v-else class="text-5xl font-bold tracking-tight">
          {{ formatCurrency(remaining) }}
        </h2>
      </div>

      <div class="mt-8 space-y-4">
        <div>
          <div class="flex justify-between text-sm mb-1 font-medium">
            <span>Expenses Ratio</span>
            <div v-if="loading" class="h-4 w-8 bg-white/20 animate-pulse rounded"></div>
            <span v-else>{{ Math.round(expensePercent) }}%</span>
          </div>
          <div class="h-3 bg-surface/20 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="expensePercent > 80 ? 'bg-error' : 'bg-primary'"
              :style="{ width: `${Math.min(expensePercent, 100)}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Allocation Controls -->
    <div
      class="bg-surface rounded-3xl p-8 border border-outline-variant/30 flex flex-col justify-center space-y-6"
    >
      <h3 class="text-xl font-bold text-on-surface">Allocation Plan</h3>

      <!-- Investment Input -->
      <div>
        <div class="flex justify-between mb-2">
          <label class="text-sm font-medium text-secondary">Investment Target</label>
          <div v-if="loading" class="h-5 w-20 bg-surface-container-high animate-pulse rounded"></div>
          <span v-else class="text-sm font-bold text-primary">{{ formatCurrency(investmentTarget) }}</span>
        </div>
        <input
          class="w-full accent-primary h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
          type="range"
          min="0"
          :max="remaining > 0 ? remaining : 1000"
          step="50"
          :value="investmentTarget"
          :disabled="loading"
          @input="
            emit('update:investmentTarget', Number(($event.target as HTMLInputElement).value))
          "
        />
      </div>

      <!-- Savings Input -->
      <div>
        <div class="flex justify-between mb-2">
          <label class="text-sm font-medium text-secondary">Savings Target</label>
          <div v-if="loading" class="h-5 w-20 bg-surface-container-high animate-pulse rounded"></div>
          <span v-else class="text-sm font-bold text-tertiary">{{ formatCurrency(savingsTarget) }}</span>
        </div>
        <input
          class="w-full accent-tertiary h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
          type="range"
          min="0"
          :max="remaining > 0 ? remaining : 1000"
          step="50"
          :value="savingsTarget"
          :disabled="loading"
          @input="emit('update:savingsTarget', Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <div class="pt-4 border-t border-outline-variant/50 flex justify-between items-center">
        <span class="text-sm text-secondary">Unallocated</span>
        <div v-if="loading" class="h-5 w-24 bg-surface-container-high animate-pulse rounded"></div>
        <span
          v-else
          class="font-mono font-medium"
          :class="unallocated < 0 ? 'text-error' : 'text-on-surface'"
        >
          {{ formatCurrency(unallocated) }}
        </span>
      </div>
    </div>
  </div>
</template>
