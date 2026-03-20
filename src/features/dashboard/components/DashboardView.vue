<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import {
  netInvested,
  currentPortfolioValue,
  totalROI,
  portfolioStore
} from '@shared/stores/portfolioStore'
import { user } from '@features/auth/stores/authStore'
import { formatCurrency, formatDate } from '@shared/lib/utils'
import type { Timestamp } from 'firebase/firestore'
import PlusIcon from '@shared/components/icons/PlusIcon.vue'
import ListIcon from '@shared/components/icons/ListIcon.vue'
import TransactionIcon from '@shared/components/icons/TransactionIcon.vue'
import AssetAllocationChart from './AssetAllocationChart.vue'
import TypeAllocationChart from './TypeAllocationChart.vue'

const $user = useStore(user)
const $netInvested = useStore(netInvested)
const $currentValue = useStore(currentPortfolioValue)
const $totalROI = useStore(totalROI)
const $portfolio = useStore(portfolioStore)

const formatTransactionDate = (date: Date | Timestamp | null) => {
  return formatDate(date)
}
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Premium Hero Section -->
    <div
      v-if="$user"
      class="relative overflow-hidden rounded-3xl bg-surface-container-low border border-outline-variant shadow-xl"
    >
      <!-- Dynamic Mesh Gradient Background -->
      <div class="absolute inset-0 -z-10 opacity-30">
        <div
          class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[80px]"
        ></div>
        <div
          class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-tertiary blur-[100px]"
        ></div>
      </div>

      <div
        class="px-6 py-10 sm:px-10 sm:py-12 flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div class="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div class="relative group">
            <img
              v-if="$user.photoURL"
              :src="$user.photoURL"
              alt="User Avatar"
              class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-primary/20 shadow-lg transition-transform group-hover:scale-105"
              referrerpolicy="no-referrer"
            />
            <div
              v-else
              class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary-container flex items-center justify-center text-on-primary-container text-3xl font-bold border-2 border-primary/20 shadow-lg"
            >
              {{ $user.displayName?.[0] || 'U' }}
            </div>
          </div>

          <div>
            <h1 class="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Hello,
              <span class="bg-linear-to-r from-primary to-tertiary bg-clip-text text-transparent">{{
                $user.displayName
              }}</span
              >!
            </h1>
            <p class="mt-2 text-on-surface-variant font-medium opacity-80">
              Welcome back to your portfolio overview.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap justify-center gap-3">
          <a
            href="/transactions"
            class="btn btn-primary btn-md rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105"
          >
            <PlusIcon class="w-5 h-5 mr-1" />
            Add Transaction
          </a>
          <a
            href="/assets"
            class="btn btn-ghost bg-surface-container-high border-outline-variant btn-md rounded-xl transition-all hover:scale-105"
          >
            <ListIcon class="w-5 h-5 mr-1" />
            Assets List
          </a>
        </div>
      </div>
    </div>
    <div
      v-else
      class="animate-pulse bg-surface-container-low h-48 rounded-3xl w-full border border-outline-variant"
    ></div>

    <!-- Alert Sections -->
    <div
      v-if="$portfolio.missingIndex"
      class="alert alert-warning shadow-md rounded-2xl border-none"
    >
      <svg class="h-6 w-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <div>
        <h3 class="font-bold text-sm">Index Required</h3>
        <p class="text-xs">Database aggregation requires a Firestore index. Check F12 console.</p>
      </div>
    </div>

    <div
      v-else-if="$portfolio.totalsError"
      class="alert alert-error shadow-md rounded-2xl border-none text-on-error-container"
    >
      <svg class="h-6 w-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div>
        <h3 class="font-bold text-sm">Error Loading Totals</h3>
        <p class="text-xs">{{ $portfolio.totalsError }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- Main KPIs -->
      <div class="lg:col-span-2 space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div
            v-for="(kpi, index) in [
              { label: 'Net Invested', value: $netInvested, color: 'primary' },
              { label: 'Portfolio Value', value: $currentValue, color: 'tertiary' },
              { label: 'Total ROI', value: $totalROI, isPercent: true }
            ]"
            :key="index"
            class="group relative overflow-hidden bg-surface-container-low/50 backdrop-blur-xl rounded-3xl border border-outline-variant p-6 transition-all hover:shadow-2xl hover:-translate-y-1"
          >
            <div
              class="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors"
            ></div>

            <dt class="text-sm font-semibold text-on-surface-variant mb-2 opacity-70">
              {{ kpi.label }}
            </dt>

            <dd
              v-if="$portfolio.calculatingTotals"
              class="h-10 bg-surface-container-high animate-pulse rounded-lg w-3/4"
            ></dd>
            <dd v-else-if="kpi.isPercent" class="flex flex-col">
              <span
                class="text-3xl font-black"
                :class="kpi.value >= 0 ? 'text-green-500' : 'text-error'"
              >
                {{ kpi.value >= 0 ? '+' : '' }}{{ kpi.value.toFixed(2) }}%
              </span>
              <span class="text-xs font-medium text-on-surface-variant mt-1">
                ({{ formatCurrency($currentValue - $netInvested) }})
              </span>
            </dd>
            <dd v-else class="text-3xl font-black text-on-surface">
              {{ formatCurrency(kpi.value) }}
            </dd>
          </div>
        </div>

        <!-- Recent Activity -->
        <div
          class="bg-surface-container-low rounded-3xl border border-outline-variant shadow-sm overflow-hidden"
        >
          <div class="px-6 py-5 border-b border-outline-variant flex items-center justify-between">
            <h2 class="text-xl font-bold flex items-center gap-2">
              <TransactionIcon type="Plan" class="w-6 h-6 text-primary" />
              Recent Activity
            </h2>
            <a href="/transactions" class="text-sm font-medium text-primary hover:underline"
              >View All</a
            >
          </div>
          <ul class="divide-y divide-outline-variant">
            <template v-if="$portfolio.loading">
              <li v-for="i in 5" :key="i" class="px-6 py-5 animate-pulse">
                <div class="flex items-center justify-between gap-4">
                  <div class="h-4 bg-surface-container-high rounded w-32"></div>
                  <div class="h-6 bg-surface-container-high rounded-full w-24"></div>
                </div>
              </li>
            </template>
            <li
              v-else-if="$portfolio.transactions.length === 0"
              class="px-6 py-12 text-center text-on-surface-variant italic"
            >
              No transactions recorded yet.
            </li>
            <li
              v-for="tx in $portfolio.transactions.slice(0, 5)"
              v-else
              :key="tx.id"
              class="group transition-colors hover:bg-surface-container-high"
            >
              <div class="px-6 py-4 flex items-center justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-sm font-bold text-on-surface truncate">
                    {{ tx.type }}
                    <span class="text-on-surface-variant font-normal opacity-70 ml-1">{{
                      tx.assetId ? `• ${tx.assetId}` : ''
                    }}</span>
                  </p>
                  <p class="text-[11px] font-medium text-on-surface-variant mt-0.5">
                    {{ formatTransactionDate(tx.date) }}
                  </p>
                </div>
                <div class="shrink-0">
                  <span
                    class="px-3 py-1 rounded-full text-xs font-bold leading-5 bg-secondary-container text-on-secondary-container shadow-sm"
                  >
                    {{ formatCurrency(tx.amount) }}
                  </span>
                </div>
              </div>
            </li>
          </ul>
        </div>

        <TypeAllocationChart />
      </div>

      <AssetAllocationChart />
    </div>
  </div>
</template>

<style scoped>
.bg-linear-to-r {
  background-size: 200% auto;
  animation: gradient 8s linear infinite;
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
