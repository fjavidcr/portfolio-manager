<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import { netInvested, currentPortfolioValue, totalROI, portfolioStore } from '@features/portfolio/stores/portfolioStore';
import { user } from '@features/auth/stores/authStore';
import { formatCurrency } from '@shared/lib/utils';


const $user = useStore(user);
const $netInvested = useStore(netInvested);
const $currentValue = useStore(currentPortfolioValue);
const $totalROI = useStore(totalROI);
const $portfolio = useStore(portfolioStore);


</script>

<template>
    <div class="space-y-6">
        <div v-if="$user" class="bg-surface-container-low overflow-hidden shadow rounded-2xl border border-outline-variant">
            <div class="px-6 py-8 flex items-center gap-6">
                 <img 
                    v-if="$user.photoURL" 
                    :src="$user.photoURL" 
                    alt="User Avatar" 
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

        <!-- KPI Grid -->
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
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
                <li v-if="$portfolio.loading" class="p-6 text-center text-gray-400">Loading activity...</li>
                <li v-else-if="$portfolio.transactions.length === 0" class="p-6 text-center text-gray-400">No transactions found.</li>
                
                <li v-for="transaction in $portfolio.transactions.slice(0, 5)" :key="transaction.id">
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
                                {{ transaction.date?.toDate ? transaction.date.toDate().toLocaleDateString() : new Date(transaction.date).toLocaleDateString() }}
                            </p>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>
