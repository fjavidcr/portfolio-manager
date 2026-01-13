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
    switch (type) {
        case 'Venta':
            return {
                bg: 'tx-emerald-bg',
                text: 'tx-emerald-text',
                border: 'tx-emerald-border',
                iconBg: 'tx-emerald-icon'
            };
        case 'Dividendo':
            return {
                bg: 'tx-amber-bg',
                text: 'tx-amber-text',
                border: 'tx-amber-border',
                iconBg: 'tx-amber-icon'
            };
        case 'Aportación':
            return {
                bg: 'tx-blue-bg',
                text: 'tx-blue-text',
                border: 'tx-blue-border',
                iconBg: 'tx-blue-icon'
            };
        case 'Retirada':
            return {
                bg: 'tx-orange-bg',
                text: 'tx-orange-text',
                border: 'tx-orange-border',
                iconBg: 'tx-orange-icon'
            };
        case 'Traspaso':
            return {
                bg: 'tx-slate-bg',
                text: 'tx-slate-text',
                border: 'tx-slate-border',
                iconBg: 'tx-slate-icon'
            };
        case 'Plan':
            return {
                bg: 'tx-indigo-bg',
                text: 'tx-indigo-text',
                border: 'tx-indigo-border',
                iconBg: 'tx-indigo-icon'
            };
        default:
            return {
                bg: 'bg-primary-container dark:bg-primary-container/20',
                text: 'text-on-primary-container dark:text-on-primary-container',
                border: 'border-primary-container dark:border-primary-container/20',
                iconBg: 'bg-primary-container text-on-primary-container dark:bg-primary-container/20'
            };
    }
};

// Improved icons (Lucide-like)
const getModernIcon = (type: string) => {
    switch (type) {
        case 'Aportación':
        case 'Plan':
            return `<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-5.94-2.28m5.94 2.28-2.28 5.941" />`;
        case 'Venta':
        case 'Retirada':
            return `<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 11.854 5.963m0 0-.916 6.32M25.14 14.427 18.82 13.51" />`;
        case 'Dividendo':
            return `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />`;
        case 'Traspaso':
            return `<path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />`;
        default:
            return `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />`;
    }
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
                    <span
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider w-fit mb-0.5"
                            :class="[getActionStyle(transaction.type).bg, getActionStyle(transaction.type).text]">
                            {{ transaction.type }}
                        </span>
                    <!-- Date (Subtle) -->
                    <p class="text-[10px] text-secondary dark:text-gray-400 font-medium truncate leading-none">
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
            <p class="text-[10px] text-secondary/60 dark:text-gray-500 mt-0.5" v-if="transaction.description">
                    {{ transaction.description }}
            </p>
        </div>
    </div>
</template>
