<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@nanostores/vue'
import {
  budgetStore,
  totalIncome,
  totalExpenses,
  totalPersonalExpenses,
  totalCommonExpenses,
  updateTargets,
  budgetStatus
} from '../stores/budgetStore'
import BudgetSummary from './BudgetSummary.vue'

const $budget = useStore(budgetStore)
const $status = useStore(budgetStatus)
const $totalIncome = useStore(totalIncome)
const $totalExpenses = useStore(totalExpenses)
const $totalPersonalExpenses = useStore(totalPersonalExpenses)
const $totalCommonExpenses = useStore(totalCommonExpenses)

const remaining = computed(() => $totalIncome.value - $totalExpenses.value)

const handleInvestmentUpdate = (investment: number) => {
  // Ensure we don't exceed remaining, but maybe allow it if user forces it?
  // For now let's trust the input/slider max, but mathematically we just set it.
  // Savings is whatever is left.
  const savings = Math.max(0, remaining.value - investment)
  updateTargets(investment, savings)
}
</script>

<template>
  <BudgetSummary
    :total-income="$totalIncome"
    :personal-expenses="$totalPersonalExpenses"
    :common-expenses="$totalCommonExpenses"
    :investment-target="$budget.savingsParams.investmentTarget"
    :savings-target="$budget.savingsParams.savingsTarget"
    :loading="$status.loading"
    @update:investment-target="handleInvestmentUpdate"
  />
</template>
