<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import { portfolioStore } from '@features/portfolio/stores/portfolioStore';
import { formatCurrency } from '@shared/lib/utils';

const $portfolio = useStore(portfolioStore);


const formatDate = (date: any) => {
    if (!date) return '';
    if (date.toDate) return date.toDate().toLocaleDateString();
    return new Date(date).toLocaleDateString();
}
</script>

<template>
  <div class="bg-surface-container-low shadow rounded-2xl border border-outline-variant overflow-hidden">
     <!-- Loading State -->
    <div v-if="$portfolio.loading" class="text-center py-10">
         <svg class="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
         <p class="mt-2 text-sm text-gray-400">Loading transactions...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="$portfolio.transactions.length === 0" class="text-center py-10 text-gray-400">
        No transactions found.
    </div>

    <ul v-else role="list" class="divide-y divide-outline-variant">
      <li v-for="transaction in $portfolio.transactions" :key="transaction.id" class="px-6 py-5 hover:bg-surface-container-high transition-colors">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-primary truncate">
             {{ transaction.type }} {{ transaction.assetId ? `- ${transaction.assetId}` : '' }}
          </p>
          <div class="ml-2 flex-shrink-0 flex">
            <p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-secondary-container text-on-secondary-container">
              {{ formatCurrency(transaction.amount) }}
            </p>
          </div>
        </div>
        <div class="mt-2 sm:flex sm:justify-between">
          <div class="sm:flex">
            <p class="flex items-center text-sm text-gray-400">
               <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
               {{ formatDate(transaction.date) }}
            </p>
            <p class="mt-2 flex items-center text-sm text-gray-400 sm:mt-0 sm:ml-6">
                 {{ transaction.description }}
            </p>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
