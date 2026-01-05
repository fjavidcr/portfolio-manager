<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import { portfolioStore } from '@shared/stores/portfolioStore';
import { formatCurrency } from '@shared/lib/utils';
import type { TransactionModel } from '@shared/types';

const props = defineProps<{
    transaction: TransactionModel;
}>();

const $portfolio = useStore(portfolioStore);

const formatDate = (date: any) => {
    if (!date) return '';
    if (date.toDate) return date.toDate().toLocaleDateString();
    return new Date(date).toLocaleDateString();
}

const getAssetName = (assetId: string) => {
    if (!assetId) return 'Unknown Asset';
    const asset = $portfolio.value.assets.find((a: any) => a.id === assetId);
    return asset ? asset.name : assetId;
};

// Distinct Colors for each type
const getActionStyle = (type: string) => {
    const t = type.toLowerCase();
    
    // Compra (Buy) -> Red (Cash Out)
    if (t.includes('compra') || t.includes('buy')) {
        return {
            bg: 'bg-rose-100 dark:bg-rose-900/30',
            text: 'text-rose-700 dark:text-rose-300',
            border: 'border-rose-200 dark:border-rose-800',
            iconBg: 'bg-rose-100 text-rose-700 dark:bg-rose-800 dark:text-rose-200'
        };
    }
    // Venta (Sell) -> Green (Cash In)
    if (t.includes('venta') || t.includes('sell')) {
        return {
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
            text: 'text-emerald-700 dark:text-emerald-300',
            border: 'border-emerald-200 dark:border-emerald-800',
            iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200'
        };
    }
    // Dividendo (Dividend) -> Amber/Gold
    if (t.includes('dividendo') || t.includes('dividend')) {
        return {
            bg: 'bg-amber-100 dark:bg-amber-900/30',
            text: 'text-amber-700 dark:text-amber-300',
            border: 'border-amber-200 dark:border-amber-800',
            iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200'
        };
    }
    // Aportación (Deposit) -> Blue
    if (t.includes('aportación') || t.includes('deposit')) {
        return {
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            text: 'text-blue-700 dark:text-blue-300',
            border: 'border-blue-200 dark:border-blue-800',
            iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200'
        };
    }
    // Retirada (Withdrawal) -> Orange
    if (t.includes('retirada') || t.includes('withdraw')) {
        return {
            bg: 'bg-orange-100 dark:bg-orange-900/30',
            text: 'text-orange-700 dark:text-orange-300',
            border: 'border-orange-200 dark:border-orange-800',
            iconBg: 'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-200'
        };
    }
    // Traspaso (Transfer) -> Slate/Gray
    if (t.includes('traspaso') || t.includes('transfer')) {
        return {
            bg: 'bg-slate-100 dark:bg-slate-900/30',
            text: 'text-slate-700 dark:text-slate-300',
            border: 'border-slate-200 dark:border-slate-800',
            iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
        };
    }
    // Plan -> Indigo/Purple
    if (t.includes('plan')) {
        return {
            bg: 'bg-indigo-100 dark:bg-indigo-900/30',
            text: 'text-indigo-700 dark:text-indigo-300',
            border: 'border-indigo-200 dark:border-indigo-800',
            iconBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200'
        };
    }

    // Default -> Primary
    return {
        bg: 'bg-primary-container',
        text: 'text-on-primary-container',
        border: 'border-primary-container',
        iconBg: 'bg-primary-container text-on-primary-container'
    };
};

// Improved icons (Lucide-like)
const getModernIcon = (type: string) => {
    const t = type.toLowerCase();
     // Buy (Plus Circle / Trend Up)
    if (t.includes('compra') || t.includes('buy') || t.includes('aportación') || t.includes('plan')) {
         return `<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-5.94-2.28m5.94 2.28-2.28 5.941" />`;
    }
    // Sell (Minus Circle / Trend Down)
    if (t.includes('venta') || t.includes('sell') || t.includes('retirada')) {
        return `<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 11.854 5.963m0 0-.916 6.32M25.14 14.427 18.82 13.51" />`; 
    }
    // Dividend (Dollar Sign)
    if (t.includes('dividendo') || t.includes('dividend')) {
        return `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />`;
    }
    // Transfer (Arrows Left Right)
    if (t.includes('traspaso') || t.includes('transfer')) {
         return `<path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />`;
    }
     // Default
    return `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />`;
};
</script>

<template>
    <div class="bg-surface-container-low rounded-2xl border border-outline-variant p-3 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        
        <!-- Decorative Top Border based on type -->
        <div class="absolute top-0 left-0 right-0 h-1" :class="getActionStyle(transaction.type).bg"></div>

        <!-- Discrete Edit Button (Absolute Top Right - smaller & tighter) -->
        <a :href="`/edit-transaction?id=${transaction.id}`" 
            class="absolute top-2 right-2 p-1.5 rounded-full bg-surface-container-highest/50 text-secondary hover:text-primary hover:bg-surface-container-highest transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
            title="Edit Transaction">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
        </a>

        <!-- Header: Type, Date & Amount -->
        <div class="flex justify-between items-center pt-1 px-1 gap-2"> 
            <div class="flex items-center gap-2 min-w-0 flex-1">
                    <!-- Icon Box (smaller padding) -->
                <div class="p-2 rounded-lg flex items-center justify-center shrink-0" 
                        :class="getActionStyle(transaction.type).iconBg">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" v-html="getModernIcon(transaction.type)">
                    </svg>
                </div>
                
                <div class="min-w-0 flex-1 flex flex-col justify-center">
                    <!-- Type Badge -->
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider w-fit mb-0.5" 
                            :class="[getActionStyle(transaction.type).bg, getActionStyle(transaction.type).text]">
                            {{ transaction.type }}
                        </span>
                    <!-- Date (Subtle) -->
                    <p class="text-[10px] text-secondary font-medium truncate leading-none">
                        {{ formatDate(transaction.date) }}
                    </p>
                </div>
            </div>

            <!-- Amount -->
            <div class="text-right shrink-0">
                    <p class="text-base font-bold tracking-tight" :class="getActionStyle(transaction.type).text">
                    {{ formatCurrency(transaction.amount) }}
                    </p>
            </div>
        </div>

        <!-- Asset Name (Prominent, Full Width) -->
        <div class="px-2 pb-1">
            <h3 class="text-lg font-bold text-on-surface leading-tight truncate" :title="getAssetName(transaction.assetId)">
                {{ getAssetName(transaction.assetId) }}
            </h3>
            <p class="text-[10px] text-secondary/60 mt-0.5" v-if="transaction.description">
                    {{ transaction.description }}
            </p>
        </div>
    </div>
</template>
