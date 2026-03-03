<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { budgetStore, updateSection, budgetStatus } from '../stores/budgetStore'
import BudgetSection from './BudgetSection.vue'

import type { BudgetItem } from '@shared/types'

const $budget = useStore(budgetStore)
const $status = useStore(budgetStatus)

const update = (items: BudgetItem[]) => updateSection('income', items)
</script>

<template>
  <BudgetSection
    title="Income Sources"
    type="income"
    :items="$budget.income"
    :loading="$status.loading"
    @update:items="update"
  />
</template>
