<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from '@nanostores/vue'
import {
  dcaStore,
  dcaStatus,
  updatePlanValues,
  addGoal,
  deleteGoal,
  totalDcaEuros
} from '../stores/dcaStore'
import { budgetStore } from '@features/budget/stores/budgetStore'
import { formatCurrency } from '@shared/lib/utils'
import CheckIcon from '@shared/components/icons/CheckIcon.vue'
import AlertIcon from '@shared/components/icons/AlertIcon.vue'
import TrashIcon from '@shared/components/icons/TrashIcon.vue'
import PlusIcon from '@shared/components/icons/PlusIcon.vue'
import GoalListSkeleton from './skeletons/GoalListSkeleton.vue'

const dca = useStore(dcaStore)
const dcaState = useStore(dcaStatus)
const budget = useStore(budgetStore)
const totalPlanned = useStore(totalDcaEuros)

const remainingFromBudget = computed(() => {
  return budget.value.savingsParams.investmentTarget - totalPlanned.value
})

const newGoalName = ref('')

const handleAddGoal = () => {
  if (!newGoalName.value) return
  addGoal(newGoalName.value)
  newGoalName.value = ''
}

const handleDeleteGoal = (id: string) => {
  if (confirm('¿Estás seguro de que quieres eliminar este objetivo?')) {
    deleteGoal(id)
  }
}

const handleEurosChange = (goalId: string, value: string) => {
  const num = parseFloat(value) || 0
  const goals = dca.value.goals.map((g) => (g.id === goalId ? { ...g, euros: num } : g))
  updatePlanValues([...goals], [...dca.value.items])
}

const calculatePercentage = (euros: number) => {
  const target = budget.value.savingsParams.investmentTarget
  if (!target) return 0
  return (euros / target) * 100
}

const isCorrect = (goalId: string) => {
  const items = dca.value.items.filter((item) => item.goalId === goalId)
  if (items.length === 0) return false

  const allocated = items.reduce((sum, item) => sum + item.percentage, 0)
  return Math.abs(allocated - 100) < 0.1
}
</script>

<template>
  <GoalListSkeleton v-if="dcaState.loading" />
  <div
    v-else
    class="bg-surface rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden"
  >
    <div class="p-6 border-b border-outline-variant/30 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-on-surface">Objetivos</h2>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-[10px] font-black uppercase text-secondary tracking-widest"
          >Disponible:</span
        >
        <div
          class="badge font-mono font-bold border-none"
          :class="
            remainingFromBudget >= 0
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30'
              : 'bg-error/10 text-error'
          "
        >
          {{ formatCurrency(remainingFromBudget) }}
        </div>
      </div>
    </div>

    <div class="p-4 space-y-4">
      <div
        v-for="goal in dca.goals"
        :key="goal.id"
        class="flex flex-col p-4 bg-surface-container-low rounded-xl gap-4 group relative"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2"
              :class="
                isCorrect(goal.id)
                  ? 'bg-green-100 dark:bg-green-900/10 border-green-200 dark:border-green-800/50 text-green-600'
                  : 'bg-amber-100 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50 text-amber-600'
              "
            >
              <CheckIcon v-if="isCorrect(goal.id)" size="sm" />
              <AlertIcon v-else size="sm" />
            </div>
            <div class="flex items-center gap-2">
              <p class="font-black text-on-surface text-lg leading-tight">{{ goal.name }}</p>
              <button
                class="p-1 px-2 text-secondary hover:text-error opacity-0 group-hover:opacity-100 transition-all hover:bg-error/10 rounded-lg"
                title="Eliminar objetivo"
                @click="handleDeleteGoal(goal.id)"
              >
                <TrashIcon size="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="text-right">
            <div class="text-2xl font-black text-primary tabular-nums leading-none">
              {{ Math.round(calculatePercentage(goal.euros)) }}%
            </div>
            <p class="text-[9px] font-black uppercase text-secondary/60 tracking-widest mt-1">
              del presupuesto
            </p>
          </div>
        </div>

        <div
          class="mt-2 bg-surface p-3 rounded-xl border border-outline-variant/30 flex items-center justify-between gap-4"
        >
          <div class="space-y-0.5">
            <label class="text-[9px] font-black text-secondary uppercase tracking-widest block ml-1"
              >Inversión Mensual</label
            >
            <div class="relative flex items-center">
              <input
                type="number"
                :value="goal.euros"
                max="10000000000"
                class="input input-ghost input-sm h-8 w-full max-w-[120px] font-mono font-black text-on-surface text-xl bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                @input="(e) => handleEurosChange(goal.id, (e.target as HTMLInputElement).value)"
              />
              <span class="text-xl font-black text-on-surface opacity-20 ml-1">€</span>
            </div>
          </div>

          <div class="flex items-center gap-1.5 pr-1">
            <div
              class="w-1.5 h-1.5 rounded-full"
              :class="isCorrect(goal.id) ? 'bg-green-500' : 'bg-amber-500'"
            ></div>
            <span
              class="text-[10px] font-bold uppercase tracking-tight"
              :class="
                isCorrect(goal.id)
                  ? 'text-green-600 dark:text-green-500/80'
                  : 'text-amber-600 dark:text-amber-500/80'
              "
            >
              {{ isCorrect(goal.id) ? 'Asignado' : 'Sin asignar' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="dca.goals.length === 0" class="text-center py-8">
        <p class="text-sm text-secondary italic">No hay objetivos creados aún.</p>
      </div>

      <!-- Add Goal Form -->
      <div class="pt-4 border-t border-outline-variant/30">
        <div class="flex gap-2">
          <input
            v-model="newGoalName"
            type="text"
            maxlength="100"
            placeholder="Nombre del nuevo objetivo (ej. Jubilación)"
            class="flex-1 input input-sm bg-surface-container-high border-outline-variant/50 text-on-surface text-sm focus:border-primary transition-colors"
            @keyup.enter="handleAddGoal"
          />
          <button
            class="btn btn-sm btn-primary px-4"
            :disabled="!newGoalName"
            @click="handleAddGoal"
          >
            <PlusIcon size="h-4 w-4" />
            <span>Añadir</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
