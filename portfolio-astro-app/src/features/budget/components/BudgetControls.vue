<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { budgetStatus, saveBudget } from '../stores/budgetStore'
import LoadingSpinner from '@shared/components/icons/LoadingSpinner.vue'

const status = useStore(budgetStatus)
</script>

<template>
  <div class="flex items-center gap-4">
    <div v-if="status.loading" class="text-sm text-secondary animate-pulse">Loading...</div>
    <div v-if="status.error" class="text-sm text-error">{{ status.error }}</div>

    <button
      :disabled="status.saving || status.loading"
      class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-2xl shadow-sm text-on-primary bg-primary hover:bg-primary-fixed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
      @click="saveBudget"
    >
      <LoadingSpinner v-if="status.saving" size="sm" class="mr-2" />
      {{ status.saving ? 'Saving...' : 'Save Changes' }}
    </button>
  </div>
</template>
