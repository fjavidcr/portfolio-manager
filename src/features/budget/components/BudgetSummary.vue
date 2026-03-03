<script setup lang="ts">
import { computed } from 'vue'
import BudgetDistributionBar from './BudgetDistributionBar.vue'

const props = defineProps<{
  totalIncome: number
  personalExpenses: number
  commonExpenses: number
  investmentTarget: number
  savingsTarget: number
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:investmentTarget', val: number): void
}>()

// Calculate totals and remainders
const totalExpenses = computed(() => props.personalExpenses + props.commonExpenses)
const remaining = computed(() => props.totalIncome - totalExpenses.value)
const maxAllocation = computed(() => Math.max(0, remaining.value))

const formatCurrency = (val: number) => {
  return val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}
</script>

<template>
  <div class="bg-surface rounded-3xl p-6 md:p-8 border border-outline-variant/30">
    <div class="flex flex-col space-y-8">
      <!-- Header & Total -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-xl font-bold text-on-surface">Budget Distribution</h2>
          <p class="text-sm text-secondary">Breakdown of your monthly income</p>
        </div>
        <div class="text-right">
          <p class="text-xs uppercase tracking-wider text-secondary font-medium">Total Income</p>
          <div v-if="loading" class="h-8 w-32 bg-surface-container-high animate-pulse rounded ml-auto"></div>
          <h3 v-else class="text-2xl font-bold text-on-surface">{{ formatCurrency(totalIncome) }}</h3>
        </div>
      </div>

      <!-- Segmented Bar Visualization -->
      <BudgetDistributionBar
        :total-income="totalIncome"
        :common-expenses="commonExpenses"
        :personal-expenses="personalExpenses"
        :investment-target="investmentTarget"
        :savings-target="savingsTarget"
        :loading="loading"
      />

      <!-- Controls -->
      <div class="pt-6 border-t border-outline-variant/30">
        <label class="text-sm font-medium text-secondary mb-4 block">Adjust Allocation</label>

        <div class="bg-surface-container-low p-4 rounded-xl">
          <div class="flex justify-between mb-4 items-center">
            <div class="flex items-center gap-2">
              <div class="p-2 bg-tertiary/10 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5 text-tertiary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div>
                <span class="text-sm font-bold block text-on-surface">Investment Target</span>
                <span class="text-xs text-secondary">Remaining funds go to savings</span>
              </div>
            </div>

            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">€</span>
              <input
                type="number"
                min="0"
                :max="maxAllocation"
                step="50"
                :value="investmentTarget"
                class="w-28 pl-6 pr-3 py-1.5 text-right bg-surface border border-outline-variant/50 rounded-lg text-sm font-bold text-primary focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary transition-colors"
                @input="
                  emit('update:investmentTarget', Number(($event.target as HTMLInputElement).value))
                "
              />
            </div>
          </div>

          <div class="flex items-center gap-4">
            <span class="text-xs font-medium text-secondary min-w-12">0 €</span>
            <input
              class="w-full accent-tertiary h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer"
              type="range"
              min="0"
              :max="maxAllocation > 0 ? maxAllocation : 1000"
              step="1"
              :value="investmentTarget"
              :disabled="loading"
              @input="
                emit('update:investmentTarget', Number(($event.target as HTMLInputElement).value))
              "
            />
            <span class="text-xs font-medium text-secondary min-w-12 text-right">{{
              formatCurrency(maxAllocation > 0 ? maxAllocation : 1000)
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
