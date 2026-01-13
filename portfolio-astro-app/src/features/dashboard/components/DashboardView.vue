<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import { netInvested, currentPortfolioValue, totalROI, portfolioStore } from '@shared/stores/portfolioStore';
import { user } from '@features/auth/stores/authStore';
import { formatCurrency } from '@shared/lib/utils';


const $user = useStore(user);
const $netInvested = useStore(netInvested);
const $currentValue = useStore(currentPortfolioValue);
const $totalROI = useStore(totalROI);
const $portfolio = useStore(portfolioStore);



const formatTransactionDate = (date: any) => {
    if (!date) return '';
    if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
};
</script>

<template>
    <div class="space-y-6">
        <div v-if="$user" class="bg-surface-container-low overflow-hidden shadow rounded-2xl border border-outline-variant">
            <div class="px-6 py-8 flex items-center gap-6">
                <img v-if="$user.photoURL" :src="$user.photoURL" alt="User Avatar"
                    class="w-20 h-20 rounded-full border-2 border-primary"
                />
                <div v-else class="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-3xl font-bold border-2 border-primary">
                    {{ $user.displayName?.[0] || 'U' }}
                </div>

                <div>
                    <h1 class="text-3xl font-bold text-on-surface">Welcome back, {{ $user.displayName }}!</h1>
                    <div class="mt-1">
                        <p class="text-sm font-medium text-on-surface-variant">{{ $user.email }}</p>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="animate-pulse bg-gray-800 h-32 rounded-2xl w-full"></div>

        <!-- Missing Index Alert -->
        <div v-if="$portfolio.missingIndex" class="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md shadow-sm">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-amber-800">Configuration Required</h3>
                    <div class="mt-2 text-sm text-amber-700">
                        <p>Server-side aggregation requires a database index. Please open the browser console (F12) and click the Firebase link to create it.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- General Totals Error (Quota etc) -->
        <div v-else-if="$portfolio.totalsError" class="bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow-sm">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">Error Loading Totals</h3>
                    <div class="mt-2 text-sm text-red-700">
                         <p>{{ $portfolio.totalsError.includes('resource-exhausted') ? 'Firestore Quota Exceeded. The daily read/aggregation limit has been reached. Please try again tomorrow or upgrade plan.' : $portfolio.totalsError }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- KPI Grid -->
        <div v-if="$portfolio.calculatingTotals" class="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div v-for="i in 3" :key="i"
                class="bg-surface-container-low shadow rounded-2xl border border-outline-variant p-6 animate-pulse">
                <div class="h-4 bg-gray-700/50 rounded w-1/3 mb-4"></div>
                <div class="h-8 bg-gray-700/50 rounded w-2/3"></div>
            </div>
        </div>

        <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <!-- Net Invested -->
            <div class="bg-surface-container-low overflow-hidden shadow rounded-2xl border border-outline-variant p-6">
                <dt class="text-sm font-medium text-gray-400 truncate">Net Invested</dt>
                <dd class="mt-2 text-3xl font-bold text-on-surface">
                    {{ formatCurrency($netInvested) }}
                </dd>
            </div>

            <!-- Current Value -->
            <div class="bg-surface-container-low overflow-hidden shadow rounded-2xl border border-outline-variant p-6">
                 <dt class="text-sm font-medium text-gray-400 truncate">Current Value</dt>
                <dd class="mt-2 text-3xl font-bold text-on-surface">
                    {{ formatCurrency($currentValue) }}
                </dd>
            </div>

             <!-- ROI -->
             <div class="bg-surface-container-low overflow-hidden shadow rounded-2xl border border-outline-variant p-6">
                <dt class="text-sm font-medium text-gray-400 truncate">Total ROI</dt>
                <dd class="mt-2 flex items-baseline gap-2">
                     <span class="text-3xl font-bold" :class="$totalROI >= 0 ? 'text-green-400' : 'text-error'">
                        {{ $totalROI >= 0 ? "+" : "" }}{{ $totalROI.toFixed(2) }}%
                    </span>
                    <span class="text-sm text-gray-400">
                         ({{ ($currentValue - $netInvested) >= 0 ? "+" : "" }}{{ formatCurrency($currentValue - $netInvested) }})
                    </span>
                </dd>
            </div>
        </div>

        <!-- Recent Activity (Using Transactions from Store) -->
        <h2 class="text-xl font-bold text-on-surface mt-8">Recent Activity</h2>
        <div class="bg-surface-container-low shadow overflow-hidden rounded-2xl border border-outline-variant">
            <ul role="list" class="divide-y divide-outline-variant">
                <template v-if="$portfolio.loading">
                    <li v-for="i in 5" :key="i" class="px-6 py-5 animate-pulse">
                        <div class="flex items-center justify-between">
                            <div class="h-4 bg-gray-700/50 rounded w-1/3"></div>
                            <div class="h-5 bg-gray-700/50 rounded-full w-20"></div>
                        </div>
                        <div class="mt-2 flex justify-between">
                            <div class="h-3 bg-gray-700/30 rounded w-1/4"></div>
                        </div>
                    </li>
                </template>
                <li v-else-if="$portfolio.transactions.length === 0" class="p-6 text-center text-gray-400">No transactions found.</li>

                <li v-else v-for="transaction in $portfolio.transactions.slice(0, 5)" :key="transaction.id">
                    <div class="px-6 py-5 hover:bg-surface-container-high transition-colors">
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
                            <p class="flex items-center text-xs text-gray-400">
                                {{ formatTransactionDate(transaction.date) }}
                            </p>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>
