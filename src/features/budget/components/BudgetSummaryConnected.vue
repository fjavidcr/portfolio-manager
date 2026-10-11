<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import {
  budgetStore,
  totalIncome,
  totalPersonalExpenses,
  totalCommonExpenses,
  totalSavingsTarget,
  updateTargets,
  budgetStatus
} from '../stores/budgetStore'
import BudgetSummary from './BudgetSummary.vue'

const $budget = useStore(budgetStore)
const $status = useStore(budgetStatus)
const $totalIncome = useStore(totalIncome)
const $totalPersonalExpenses = useStore(totalPersonalExpenses)
const $totalCommonExpenses = useStore(totalCommonExpenses)
const $totalSavingsTarget = useStore(totalSavingsTarget)

const handleInvestmentUpdate = (investment: number) => {
  updateTargets(investment)
}
</script>

<template>
  <BudgetSummary
    :total-income="$totalIncome"
    :personal-expenses="$totalPersonalExpenses"
    :common-expenses="$totalCommonExpenses"
    :investment-target="$budget.savingsParams.investmentTarget"
    :savings-target="$totalSavingsTarget"
    :loading="$status.loading"
    @update:investment-target="handleInvestmentUpdate"
  />
</template>
