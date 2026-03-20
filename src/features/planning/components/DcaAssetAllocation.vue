<script setup lang="ts">
import { ref, computed as vueComputed } from 'vue'
import { useStore } from '@nanostores/vue'
import {
  dcaStore,
  dcaStatus,
  dcaItemsWithAssets,
  updatePlanValues,
  addPlanItem,
  deletePlanItem
} from '../stores/dcaStore'
import { portfolioStore } from '@shared/stores/portfolioStore'
import { formatCurrency } from '@shared/lib/utils'
import TrashIcon from '@shared/components/icons/TrashIcon.vue'
import PlusIcon from '@shared/components/icons/PlusIcon.vue'
import SearchableSelect, { type SelectOption } from '@shared/components/SearchableSelect.vue'
import AssetAllocationSkeleton from './skeletons/AssetAllocationSkeleton.vue'

const dca = useStore(dcaStore)
const dcaState = useStore(dcaStatus)
const portfolio = useStore(portfolioStore)
const isLoading = vueComputed(() => dcaState.value.loading || portfolio.value.loading)
const itemsWithAssets = useStore(dcaItemsWithAssets)

const selectedAssetId = ref('')
const selectedGoalId = ref('')

const availableAssets = vueComputed(() => {
  return portfolio.value.assets
    .filter((asset) => !asset.isArchived)
    .map((asset) => {
      const platform = portfolio.value.platforms.find((p) => p.id === asset.platformId)
      return {
        id: asset.id,
        label: asset.name,
        metadata: {
          ticker: asset.id,
          platform: platform?.name || 'Unknown'
        }
      } as SelectOption
    })
})

const goalOptions = vueComputed(() => {
  return dca.value.goals.map(
    (goal) =>
      ({
        id: goal.id,
        label: goal.name
      }) as SelectOption
  )
})

const handleAddItem = () => {
  if (!selectedAssetId.value || !selectedGoalId.value) return
  addPlanItem(selectedAssetId.value, selectedGoalId.value)
  selectedAssetId.value = ''
  // Keep goal id for faster multi-add
}

const handleDeleteItem = (id: string) => {
  deletePlanItem(id)
}

const handleItemPercentageChange = (itemId: string, value: string) => {
  const num = parseFloat(value) || 0
  const items = dca.value.items.map((i) => (i.id === itemId ? { ...i, percentage: num } : i))
  updatePlanValues([...dca.value.goals], [...items])
}

const getGoalName = (goalId: string) => {
  return dca.value.goals.find((g) => g.id === goalId)?.name || 'Sin asignar'
}

const calculateMonthly = (goalId: string, percentage: number) => {
  const goal = dca.value.goals.find((g) => g.id === goalId)
  if (!goal) return 0
  return (goal.euros * percentage) / 100
}
</script>

<template>
  <AssetAllocationSkeleton v-if="isLoading" />
  <div v-else class="bg-surface rounded-2xl shadow-sm border border-outline-variant/30">
    <div class="p-6 border-b border-outline-variant/30 flex items-center gap-2">
      <div
        class="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <h2 class="text-xl font-bold text-on-surface">Distribución por Activos</h2>
    </div>

    <div class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr class="text-secondary border-b border-outline-variant/30">
            <th class="bg-transparent font-bold text-[10px] uppercase tracking-widest pl-6 py-4">
              Activo
            </th>
            <th class="bg-transparent font-bold text-[10px] uppercase tracking-widest py-4">
              Plataforma
            </th>
            <th class="bg-transparent font-bold text-[10px] uppercase tracking-widest py-4">
              Objetivo
            </th>
            <th
              class="bg-transparent font-bold text-[10px] uppercase tracking-widest text-right py-4"
            >
              Peso %
            </th>
            <th
              class="bg-transparent font-bold text-[10px] uppercase tracking-widest text-right pr-6 py-4"
            >
              Inversión
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant/20">
          <tr
            v-for="item in itemsWithAssets"
            :key="item.id"
            class="hover:bg-surface-container-low transition-colors border-b border-outline-variant/10 group"
          >
            <td class="pl-6 py-4">
              <div class="flex items-center gap-3">
                <button
                  class="p-1 text-secondary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar de la planificación"
                  @click="handleDeleteItem(item.id)"
                >
                  <TrashIcon size="sm" />
                </button>
                <div>
                  <p class="font-bold text-on-surface">{{ item.assetName }}</p>
                  <p class="text-[10px] font-medium text-secondary">{{ item.assetType }}</p>
                </div>
              </div>
            </td>
            <td class="py-4">
              <span
                class="badge badge-sm badge-outline font-bold text-[10px] border-outline-variant/50 text-secondary"
              >
                {{ item.platformName }}
              </span>
            </td>
            <td class="py-4">
              <span class="text-xs font-bold text-on-surface-variant">{{
                getGoalName(item.goalId)
              }}</span>
            </td>
            <td class="text-right py-4">
              <div class="flex items-center justify-end gap-1">
                <input
                  type="number"
                  :value="item.percentage"
                  class="input input-xs w-16 bg-surface-container-high border-outline-variant/50 text-right font-mono font-bold text-primary focus:border-primary transition-colors"
                  @input="
                    (e) => handleItemPercentageChange(item.id, (e.target as HTMLInputElement).value)
                  "
                />
                <span class="text-[10px] font-bold text-secondary opacity-50">%</span>
              </div>
            </td>
            <td class="text-right pr-6 py-4">
              <p class="font-mono font-bold text-on-surface">
                {{ formatCurrency(calculateMonthly(item.goalId, item.percentage)) }}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-if="itemsWithAssets.length === 0" class="p-12 text-center">
      <p class="text-sm font-medium text-secondary italic">
        No hay activos configurados para la planificación.
      </p>
    </div>

    <!-- Add Asset Form -->
    <div class="p-6 bg-surface-container-low border-t border-outline-variant/30 rounded-b-2xl">
      <div class="flex flex-col sm:flex-row gap-4 items-end">
        <div class="flex-1 w-full min-w-[200px]">
          <SearchableSelect
            v-model="selectedAssetId"
            :options="availableAssets"
            label="Seleccionar Activo"
            placeholder="Elegir producto..."
          >
            <template #option="{ option }">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-bold text-on-surface">{{ option.label }}</p>
                  <p class="text-[10px] text-secondary font-medium">
                    {{ option.metadata?.ticker }}
                  </p>
                </div>
                <span
                  class="text-[9px] font-black uppercase text-secondary/40 border border-outline-variant/30 px-1.5 py-0.5 rounded"
                >
                  {{ option.metadata?.platform }}
                </span>
              </div>
            </template>
          </SearchableSelect>
        </div>

        <div class="flex-1 w-full min-w-[200px]">
          <SearchableSelect
            v-model="selectedGoalId"
            :options="goalOptions"
            label="Asignar a Objetivo"
            placeholder="Elegir objetivo..."
          />
        </div>

        <button
          class="btn btn-sm btn-primary w-full sm:w-auto px-6 h-10"
          :disabled="!selectedAssetId || !selectedGoalId"
          @click="handleAddItem"
        >
          <PlusIcon size="h-4 w-4" />
          <span>Añadir al Plan</span>
        </button>
      </div>
    </div>
  </div>
</template>
