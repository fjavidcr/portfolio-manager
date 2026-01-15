<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { computed } from 'vue'
import {
  totalPersonalExpenses,
  totalCommonExpenses,
  // Assuming we have a store for current total savings/emergency fund.
  // If not, for now we might need to mock it or use accumulated savings if available.
  // Checking budgetStore again, it seems we primarily track monthly flows.
  // The spreadsheet shows "Fondo de emergencia" as a static value or accumulated.
  // I will assume for this card we are showing the *Targets* based on flows,
  // and maybe compare against a hypothetical current saving if I can find where it is stored.
  // If no "Current Assets" store exists, I will just display the calculated Targets for now.
} from '../stores/budgetStore'

const $personal = useStore(totalPersonalExpenses)
const $common = useStore(totalCommonExpenses)

const costOfLiving = computed(() => $personal.value + $common.value)

const target3Months = computed(() => costOfLiving.value * 3)
const target6Months = computed(() => costOfLiving.value * 6)
const target12Months = computed(() => costOfLiving.value * 12)

const formatCurrency = (val: number) => {
  return val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}
</script>

<template>
  <div class="bg-surface rounded-3xl p-6 border border-outline-variant/30">
     <div class="flex items-center gap-2 mb-6">
        <div class="p-2 bg-emerald-500/10 rounded-lg">
           <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        </div>
        <div>
           <h3 class="text-lg font-bold text-on-surface">Financial Health Targets</h3>
           <p class="text-xs text-secondary">Emergency Fund goals based on monthly expenses</p>
        </div>
     </div>

     <div class="flex flex-col gap-4">
        <!-- Living Cost -->
        <div class="flex justify-between items-center pb-4 border-b border-outline-variant/30">
            <span class="text-sm font-medium text-secondary">Monthly Cost of Living</span>
            <span class="text-lg font-bold text-on-surface">{{ formatCurrency(costOfLiving) }}</span>
        </div>

        <!-- Targets -->
        <div class="space-y-4">
             <!-- 3 Months -->
             <div class="space-y-1">
                 <div class="flex justify-between text-xs">
                     <span class="font-medium text-secondary">Safety Net (3 Months)</span>
                     <span class="font-bold text-on-surface">{{ formatCurrency(target3Months) }}</span>
                 </div>
                 <div class="h-2 bg-surface-container-high rounded-full overflow-hidden">
                     <div class="h-full bg-emerald-500/50 w-full opacity-30"></div>
                     <!-- Represents a placeholder since we don't have current asset state yet to fill it -->
                 </div>
             </div>

             <!-- 6 Months -->
             <div class="space-y-1">
                 <div class="flex justify-between text-xs">
                     <span class="font-medium text-tertiary">Recommended (6 Months)</span>
                     <span class="font-bold text-tertiary">{{ formatCurrency(target6Months) }}</span>
                 </div>
                  <div class="h-2 bg-surface-container-high rounded-full overflow-hidden">
                     <div class="h-full bg-tertiary/50 w-full opacity-30"></div>
                 </div>
             </div>

             <!-- 12 Months -->
             <div class="space-y-1">
                 <div class="flex justify-between text-xs">
                     <span class="font-medium text-primary">Fortress (12 Months)</span>
                     <span class="font-bold text-primary">{{ formatCurrency(target12Months) }}</span>
                 </div>
                 <div class="h-2 bg-surface-container-high rounded-full overflow-hidden">
                     <div class="h-full bg-primary/50 w-full opacity-30"></div>
                 </div>
             </div>
        </div>
     </div>
  </div>
</template>
