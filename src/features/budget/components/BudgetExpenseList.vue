<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { budgetStore, updateSection, budgetStatus } from '../stores/budgetStore'
import BudgetSection from './BudgetSection.vue'

import type { BudgetItem } from '@shared/types'

const props = defineProps<{
  category: 'personal' | 'common'
  title: string
}>()

const $budget = useStore(budgetStore)
const $status = useStore(budgetStatus)

const handleUpdate = (newItems: BudgetItem[]) => {
  updateSection(props.category === 'personal' ? 'personalExpenses' : 'commonExpenses', newItems)
}
</script>

<template>
  <BudgetSection
    :title="title"
    type="expense"
    :items="category === 'personal' ? $budget.personalExpenses : $budget.commonExpenses"
    :allow-share="category === 'common'"
    :loading="$status.loading"
    @update:items="handleUpdate"
  />
</template>
