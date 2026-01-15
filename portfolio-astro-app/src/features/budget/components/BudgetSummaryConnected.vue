<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { budgetStore, totalIncome, totalExpenses, updateTargets, budgetStatus } from '../stores/budgetStore'
import BudgetSummary from './BudgetSummary.vue'

const $budget = useStore(budgetStore)
const $status = useStore(budgetStatus)
const $totalIncome = useStore(totalIncome)
const $totalExpenses = useStore(totalExpenses)

const handleTargets = (inv: number, sav: number) => {
  updateTargets(inv, sav)
}
</script>

<template>
  <BudgetSummary
    :total-income="$totalIncome"
    :total-expenses="$totalExpenses"
    :investment-target="$budget.savingsParams.investmentTarget"
    :savings-target="$budget.savingsParams.savingsTarget"
    :loading="$status.loading"
    @update:investment-target="(val) => handleTargets(val, $budget.savingsParams.savingsTarget)"
    @update:savings-target="(val) => handleTargets($budget.savingsParams.investmentTarget, val)"
  />
</template>
