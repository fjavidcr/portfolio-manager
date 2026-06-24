<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@nanostores/vue'
import { portfolioStore } from '@shared/stores/portfolioStore'
import { formatCurrency } from '@shared/lib/utils'
import VueApexCharts from 'vue3-apexcharts'

const $portfolio = useStore(portfolioStore)

// Custom date formatter to avoid timezone shifting issues
const formatTooltipDate = (dateStr: string) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Chart Series
const chartSeries = computed(() => {
  if (!$portfolio.value.balanceHistory || !$portfolio.value.balanceHistory.length) return []
  return [
    {
      name: 'Valor Total',
      data: $portfolio.value.balanceHistory.map((item) => item.totalValue)
    }
  ]
})

// Chart Options
const chartOptions = computed(() => {
  const categories = $portfolio.value.balanceHistory.map((item) => item.date)

  return {
    chart: {
      type: 'area' as const,
      toolbar: { show: false },
      background: 'transparent',
      zoom: { enabled: false },
      animations: {
        enabled: true,
        easing: 'easeinout' as const,
        speed: 800
      }
    },
    stroke: {
      curve: 'smooth' as const,
      width: 3,
      colors: ['#6366f1'] // Indigo premium color
    },
    fill: {
      type: 'gradient' as const,
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.02,
        stops: [0, 90, 100],
        colorStops: [
          {
            offset: 0,
            color: '#6366f1',
            opacity: 0.4
          },
          {
            offset: 100,
            color: '#6366f1',
            opacity: 0.0
          }
        ]
      }
    },
    grid: {
      show: true,
      borderColor: 'var(--color-outline-variant)',
      opacity: 0.2,
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 10, right: 10, bottom: 0, left: 10 }
    },
    markers: {
      size: 4,
      colors: ['#6366f1'],
      strokeColors: 'var(--color-surface)',
      strokeWidth: 2,
      hover: { size: 6 }
    },
    xaxis: {
      type: 'category' as const,
      categories: categories,
      labels: {
        formatter: (val: string) => {
          if (!val) return ''
          const [y, m, d] = val.split('-').map(Number)
          const date = new Date(y, m - 1, d)
          return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
        },
        style: {
          colors: 'var(--color-on-surface-variant)',
          fontSize: '11px',
          fontWeight: 500
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        formatter: (val: number) => formatCurrency(val),
        style: {
          colors: 'var(--color-on-surface-variant)',
          fontSize: '11px',
          fontWeight: 500
        }
      }
    },
    tooltip: {
      theme: 'dark',
      custom: ({ seriesIndex, dataPointIndex, w }: any) => {
        const item = $portfolio.value.balanceHistory[dataPointIndex]
        if (!item) return ''

        let assetsHtml = ''
        const sortedAssets = Object.entries(item.assets || {})
          .filter(([, val]) => val > 0)
          .sort((a, b) => b[1] - a[1])

        sortedAssets.forEach(([id, val]) => {
          assetsHtml += `
            <div class="flex justify-between gap-6 text-xs mt-1">
              <span class="font-medium text-white/70">${id}:</span>
              <span class="font-bold text-white">${formatCurrency(val)}</span>
            </div>
          `
        })

        return `
          <div class="p-4 bg-surface-container-highest/95 backdrop-blur-md border border-outline-variant rounded-2xl shadow-xl min-w-[240px]">
            <div class="font-bold text-white/50 text-[10px] uppercase tracking-wider mb-1">
              ${formatTooltipDate(item.date)}
            </div>
            <div class="flex justify-between gap-6 text-base font-black text-primary border-b border-outline-variant/30 pb-2 mb-2">
              <span>Balance Total:</span>
              <span>${formatCurrency(item.totalValue)}</span>
            </div>
            <div class="space-y-1">
              ${assetsHtml || '<div class="text-xs italic text-white/40">Sin activos registrados</div>'}
            </div>
          </div>
        `
      }
    },
    states: {
      hover: { filter: { type: 'none' } }
    }
  }
})
</script>

<template>
  <div
    class="bg-surface-container-low rounded-3xl border border-outline-variant shadow-lg p-6 flex flex-col"
  >
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold flex items-center gap-2">
          <!-- Premium Sparkline/History icon inlined -->
          <svg
            class="w-6 h-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
            />
          </svg>
          Historial del Balance
        </h2>
        <p class="text-xs text-on-surface-variant font-medium opacity-70 mt-1">
          Evolución diaria del valor de tu portafolio
        </p>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!$portfolio.balanceHistory || !$portfolio.balanceHistory.length"
      class="py-12 flex flex-col items-center justify-center text-center"
    >
      <div
        class="w-16 h-16 rounded-full border-2 border-dashed border-outline-variant flex items-center justify-center mb-4 opacity-50"
      >
        <svg
          class="w-6 h-6 text-outline-variant animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 17.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
      </div>
      <p class="text-on-surface-variant text-xs font-semibold">Sin historial registrado aún.</p>
      <p class="text-on-surface-variant/60 text-[10px] mt-1 max-w-[280px]">
        El balance de hoy se guardará automáticamente al interactuar con tus activos o agregar transacciones.
      </p>
    </div>

    <!-- Chart -->
    <div v-else class="min-h-[300px] w-full">
      <VueApexCharts
        width="100%"
        height="300"
        :options="chartOptions"
        :series="chartSeries"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.apexcharts-canvas) {
  margin: 0 auto;
}

:deep(.apexcharts-tooltip) {
  border-radius: 16px !important;
  border: none !important;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3) !important;
}
</style>
