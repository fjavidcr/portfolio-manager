<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import { portfolioStore, fetchTransactions } from '@shared/stores/portfolioStore';
import { watch, onMounted, ref, onUnmounted } from 'vue';
import TransactionCard from './TransactionCard.vue';

const $portfolio = useStore(portfolioStore);
const observerTarget = ref<HTMLElement | null>(null);

// Debug: Log transactions (keeping for verification)
watch(() => $portfolio.value.transactions, (newTransactions) => {
    if (newTransactions && newTransactions.length > 0) {
        // console.log("Transaction Data Debug:", newTransactions[0]);
    }
}, { immediate: true });

onMounted(() => {
    // Setup Intersection Observer for Infinite Scroll
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !$portfolio.value.loading && $portfolio.value.hasMore) {
            fetchTransactions();
        }
    }, {
        root: null,
        threshold: 0.1,
        rootMargin: '100px' // Load 100px before end
    });

    if (observerTarget.value) {
        observer.observe(observerTarget.value);
    }
    
    // Initial fetch handled by store subscription but ensure check
    if ($portfolio.value.transactions.length === 0) {
        fetchTransactions(true);
    }

    onUnmounted(() => {
        if (observerTarget.value) observer.unobserve(observerTarget.value);
        observer.disconnect();
    });
});
</script>

<template>
  <div class="space-y-6">
     <!-- Initial Loading State (Only when empty) -->
    <div v-if="$portfolio.loading && $portfolio.transactions.length === 0" class="text-center py-10">
         <svg class="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
         <p class="mt-2 text-sm text-secondary">Loading transactions...</p>
    </div>

    <!-- Empty State (No transactions after load) -->
    <div v-else-if="!$portfolio.loading && $portfolio.transactions.length === 0" class="text-center py-10 text-secondary">
        No transactions found.
    </div>

    <!-- Transaction List (Always show if we have data) -->
    <div v-else>
        <!-- Unified Responsive Grid Layout -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TransactionCard 
                v-for="transaction in $portfolio.transactions" 
                :key="transaction.id" 
                :transaction="transaction" 
            />
        </div>
    </div>

    <!-- Loading Sentinel / Spinner -->
    <div ref="observerTarget" class="py-6 flex justify-center w-full">
         <div v-if="$portfolio.loading" class="flex items-center justify-center gap-2 text-secondary text-sm">
             <svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
             Loading more...
         </div>
         <div v-else-if="!$portfolio.hasMore && $portfolio.transactions.length > 0" class="text-xs text-secondary/50">
             End of list
         </div>
    </div>

  </div>
</template>
