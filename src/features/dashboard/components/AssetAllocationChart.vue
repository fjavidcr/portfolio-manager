<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from '@nanostores/vue'
import { currentPortfolioValue, portfolioStore } from '@shared/stores/portfolioStore'
import { formatCurrency } from '@shared/lib/utils'
import VueApexCharts from 'vue3-apexcharts'
import ListIcon from '@shared/components/icons/ListIcon.vue'

const $currentValue = useStore(currentPortfolioValue)
const $portfolio = useStore(portfolioStore)

const showDetailedView = ref(false)

const calculatePercentage = (value: number) => {
  if (!$currentValue.value) return 0
  return (value / $currentValue.value) * 100
}

// Chart Data & Options
const sortedAssets = computed(() => {
  return [...$portfolio.value.assets]
    .filter((asset) => (asset.currentValue || 0) > 0)
    .sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0))
})

const chartSeries = computed(() => {
  if (!sortedAssets.value.length) return []
  return sortedAssets.value.map((asset) => asset.currentValue || 0)
})

const chartOptions = computed(() => {
  const assetNames = sortedAssets.value.map((asset) => asset.name || asset.id)

  return {
    chart: {
      type: 'donut' as const,
      animations: {
        enabled: true,
        easing: 'easeinout' as const,
        speed: 800
      }
    },
    labels: assetNames,
    colors: [
      '#6366f1',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
      '#f97316',
      '#22c55e',
      '#3b82f6'
    ],
    stroke: {
      show: true,
      width: 2,
      colors: ['var(--color-surface-container-low)']
    },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-on-surface-variant)'
            },
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--color-on-surface)',
              formatter: (val: number) => formatCurrency(val)
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-on-surface-variant)',
              formatter: () => formatCurrency($currentValue.value)
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    legend: {
      show: false
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      y: {
        formatter: (val: number) => formatCurrency(val)
      }
    },
    states: {
      hover: {
        filter: {
          type: 'lighten',
          value: 0.15
        }
      }
    }
  }
})
</script>

<template>
  <div
    class="bg-surface-container-low rounded-3xl border border-outline-variant shadow-lg p-6 flex flex-col"
  >
    <h2 class="text-xl font-bold mb-2">Asset Allocation</h2>
    <p class="text-xs text-on-surface-variant mb-6 font-medium opacity-70">
      Distribution by current value
    </p>

    <div
      v-if="$portfolio.assets.length === 0"
      class="flex-1 flex flex-col items-center justify-center text-center p-8"
    >
      <div
        class="w-24 h-24 rounded-full border-4 border-dashed border-outline-variant flex items-center justify-center mb-4"
      >
        <ListIcon class="w-8 h-8 text-outline-variant" />
      </div>
      <p class="text-on-surface-variant text-sm font-medium">No assets to visualize.</p>
    </div>

    <div v-else class="flex-1 flex flex-col">
      <div class="min-h-[250px] w-full flex items-center justify-center">
        <VueApexCharts width="100%" height="300" :options="chartOptions" :series="chartSeries" />
      </div>

      <div class="mt-4 space-y-2">
        <div
          v-for="(asset, i) in sortedAssets.slice(0, 5)"
          :key="i"
          class="flex items-center justify-between gap-2 text-[11px] sm:text-xs"
        >
          <div class="flex items-center gap-2 min-w-0">
            <div
              class="w-2 h-2 rounded-full shrink-0"
              :style="{ backgroundColor: chartOptions.colors[i % chartOptions.colors.length] }"
            ></div>
            <span class="font-bold truncate text-on-surface">{{ asset.name || asset.id }}</span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="font-bold text-on-surface"
              >{{ calculatePercentage(asset.currentValue || 0).toFixed(2) }}%</span
            >
            <span class="text-on-surface-variant opacity-60"
              >({{ formatCurrency(asset.currentValue || 0) }})</span
            >
          </div>
        </div>
        <div
          v-if="sortedAssets.length > 5"
          class="pt-1 text-center text-[10px] text-primary font-bold"
        >
          + {{ sortedAssets.length - 5 }} more assets
        </div>
      </div>

      <button
        class="mt-6 w-full btn btn-sm bg-surface-container-high border-outline-variant rounded-xl capitalize hover:bg-surface-container-highest transition-colors font-bold text-xs focus:outline-none focus:ring-2 focus:ring-primary"
        :aria-expanded="showDetailedView"
        aria-controls="detailed-breakdown"
        @click="showDetailedView = !showDetailedView"
      >
        {{ showDetailedView ? 'Hide' : 'View' }} Detailed Breakdown
      </button>

      <Transition name="fade-slide">
        <div
          v-if="showDetailedView"
          id="detailed-breakdown"
          class="mt-4 border-t border-outline-variant pt-4"
        >
          <div class="overflow-x-auto">
            <table class="table table-xs w-full">
              <thead>
                <tr class="text-on-surface-variant font-bold border-b border-outline-variant/30">
                  <th class="px-1 py-2">Asset</th>
                  <th class="px-1 py-2 text-right">Value</th>
                  <th class="px-1 py-2 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="asset in sortedAssets"
                  :key="asset.id"
                  class="border-b border-outline-variant/10 hover:bg-primary/5 transition-colors"
                >
                  <td class="px-1 py-2 font-medium max-w-[80px] truncate">
                    {{ asset.name || asset.id }}
                  </td>
                  <td class="px-1 py-2 text-right font-semibold">
                    {{ formatCurrency(asset.currentValue || 0) }}
                  </td>
                  <td class="px-1 py-2 text-right font-black text-primary">
                    {{ calculatePercentage(asset.currentValue || 0).toFixed(2) }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
:deep(.apexcharts-canvas) {
  margin: 0 auto;
}

:deep(.apexcharts-tooltip) {
  border-radius: 12px !important;
  border: none !important;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
