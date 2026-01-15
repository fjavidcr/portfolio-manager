<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { computed } from 'vue'
import {
  budgetStore,
  totalIncome,
  totalExpenses
} from '../stores/budgetStore'

const $budget = useStore(budgetStore)
const $totalIncome = useStore(totalIncome)
const $totalExpenses = useStore(totalExpenses)

const annualIncome = computed(() => $totalIncome.value * 12)
const annualExpenses = computed(() => $totalExpenses.value * 12)
const annualSavings = computed(() => {
    const monthlySavings = $budget.value.savingsParams.savingsTarget
    return monthlySavings * 12
})
const annualInvestments = computed(() => {
    const monthlyInvestments = $budget.value.savingsParams.investmentTarget
    return monthlyInvestments * 12
})

const formatCurrency = (val: number) => {
  return val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}
</script>

<template>
  <div class="bg-surface rounded-3xl p-6 border border-outline-variant/30">
     <div class="flex items-center gap-2 mb-6">
        <div class="p-2 bg-tertiary/10 rounded-lg">
           <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
        <div>
           <h3 class="text-lg font-bold text-on-surface">Annual Projection</h3>
           <p class="text-xs text-secondary">Based on current monthly plan</p>
        </div>
     </div>

     <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="flex flex-col items-center justify-center bg-surface-container-low px-2 py-3 rounded-xl">
           <p class="text-center text-xs font-medium text-secondary uppercase tracking-wider mb-1">Total Income</p>
           <p class="text-center text-lg font-bold text-on-surface">{{ formatCurrency(annualIncome) }}</p>
        </div>
        <div class="flex flex-col items-center justify-center bg-surface-container-low px-2 py-3 rounded-xl">
           <p class="text-center text-xs font-medium text-secondary uppercase tracking-wider mb-1">Est. Expenses</p>
           <p class="text-center text-lg font-bold text-on-surface">{{ formatCurrency(annualExpenses) }}</p>
        </div>
        <div class="flex flex-col items-center justify-center bg-tertiary/10 px-2 py-3 rounded-xl border border-tertiary/20">
           <p class="text-center text-xs font-bold text-tertiary uppercase tracking-wider mb-1">Projected Investments</p>
           <p class="text-center text-xl font-bold text-tertiary">{{ formatCurrency(annualInvestments) }}</p>
        </div>
        <div class="flex flex-col items-center justify-center bg-emerald-500/10 px-2 py-3 rounded-xl border border-emerald-500/20">
           <p class="text-center text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Projected Savings</p>
           <p class="text-center text-xl font-bold text-emerald-500">{{ formatCurrency(annualSavings) }}</p>
        </div>
     </div>
  </div>
</template>
