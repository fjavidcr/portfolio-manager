<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@nanostores/vue'
import {
  currentPortfolioValue,
  portfolioStore
} from '@shared/stores/portfolioStore'
import { formatCurrency } from '@shared/lib/utils'
import VueApexCharts from 'vue3-apexcharts'
import ListIcon from '@shared/components/icons/ListIcon.vue'

const $currentValue = useStore(currentPortfolioValue)
const $portfolio = useStore(portfolioStore)

const calculatePercentage = (value: number) => {
  if (!$currentValue.value) return 0
  return (value / $currentValue.value) * 100
}

// Type Allocation logic
const typeAllocation = computed(() => {
  const groups: Record<string, number> = {}
  $portfolio.value.assets.forEach((asset) => {
    const type = asset.type || 'Other'
    groups[type] = (groups[type] || 0) + (asset.currentValue || 0)
  })
  return Object.entries(groups)
    .filter(([_, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
})

const typeChartSeries = computed(() => {
  return [{
    data: typeAllocation.value.map(([type, value]) => ({
      x: type,
      y: value
    }))
  }]
})

const typeChartOptions = computed(() => {
  return {
    chart: {
      type: 'treemap' as const,
      toolbar: { show: false },
      background: 'transparent'
    },
    plotOptions: {
      treemap: {
        distributed: true,
        enableShades: false
      }
    },
    colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'],
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        fontWeight: 700
      },
      formatter: (text: string, op: any) => {
        return [text, formatCurrency(op.value)]
      },
      offsetY: -4
    },
    tooltip: {
      theme: 'dark',
      custom: ({ seriesIndex, dataPointIndex, w }: any) => {
        const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex]
        return `
          <div class="p-3 bg-surface-container-highest border border-outline-variant rounded-xl shadow-xl">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-2 h-2 rounded-full" style="background-color: ${w.globals.colors[dataPointIndex]}"></div>
              <span class="font-bold text-white">${data.x}</span>
            </div>
            <div class="text-xs font-medium text-white/70">
              ${formatCurrency(data.y)} <span class="text-white font-bold">(${calculatePercentage(data.y).toFixed(2)}%)</span>
            </div>
          </div>
        `
      }
    },
    legend: { show: false },
    stroke: {
      show: true,
      width: 2,
      colors: ['var(--color-surface-container-low)']
    }
  }
})
</script>

<template>
  <div class="bg-surface-container-low/50 backdrop-blur-xl rounded-3xl border border-outline-variant shadow-lg p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold">Allocation by Type</h2>
        <p class="text-xs text-on-surface-variant font-medium opacity-70">Distribution by category</p>
      </div>
      <div class="p-2 bg-secondary-container/30 rounded-xl text-secondary">
        <ListIcon class="w-5 h-5" />
      </div>
    </div>
    
    <div v-if="typeAllocation.length === 0" class="py-12 flex flex-col items-center justify-center text-center">
       <div class="w-16 h-16 rounded-full border-2 border-dashed border-outline-variant flex items-center justify-center mb-4 opacity-50">
           <ListIcon class="w-6 h-6 text-outline-variant" />
       </div>
       <p class="text-on-surface-variant text-xs font-medium">No types to visualize.</p>
    </div>
    
    <div v-else class="min-h-[250px]">
      <VueApexCharts
        width="100%"
        height="280"
        :options="typeChartOptions"
        :series="typeChartSeries"
      />
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
</style>
