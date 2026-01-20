<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BudgetItem, BudgetFrequency } from '@shared/types'
import TrashIcon from '@shared/components/icons/TrashIcon.vue'
import PlusIcon from '@shared/components/icons/PlusIcon.vue'
import { formatCurrency } from '@shared/lib/utils'

const props = defineProps<{
  title: string
  items: readonly BudgetItem[]
  type: 'income' | 'expense'
  allowShare?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:items', items: BudgetItem[]): void
}>()

const newItemName = ref('')
const newItemAmount = ref('')
const newItemFrequency = ref<BudgetFrequency>('Monthly')
const newItemShare = ref(100)

const totalMonthly = computed(() => {
  return props.items.reduce((sum, item) => {
    let amount = item.amount
    if (props.allowShare && item.share !== undefined) {
      amount = amount * (item.share / 100)
    }
    if (item.frequency === 'Annual') {
      amount = amount / 12
    }
    return sum + amount
  }, 0)
})

const addItem = () => {
  if (!newItemName.value || !newItemAmount.value) return

  const newItem: BudgetItem = {
    id: crypto.randomUUID(),
    name: newItemName.value,
    amount: Number(newItemAmount.value),
    frequency: newItemFrequency.value,
    share: props.allowShare ? newItemShare.value : 100
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit('update:items', [...props.items, newItem] as any)

  // Reset form
  newItemName.value = ''
  newItemAmount.value = ''
  newItemFrequency.value = 'Monthly'
  newItemShare.value = 100
}

const removeItem = (id: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit('update:items', props.items.filter((i) => i.id !== id) as any)
}
</script>

<template>
  <div class="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant/30">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-bold text-on-surface">{{ title }}</h3>
      <span class="text-sm font-medium text-secondary">
        Total:
        <span
          v-if="loading"
          class="inline-block w-20 h-5 bg-surface-container-high animate-pulse rounded align-middle ml-1"
        ></span>
        <span v-else :class="type === 'income' ? 'text-green-500' : 'text-red-500'">{{
          formatCurrency(totalMonthly)
        }}</span>
        <span v-if="!loading"> / mo</span>
      </span>
    </div>

    <!-- List -->
    <div class="space-y-3 mb-6">
      <!-- Skeleton Loading -->
      <div v-if="loading">
        <div
          v-for="i in 3"
          :key="i"
          class="flex items-center justify-between p-3 bg-surface-container-low rounded-xl"
        >
          <div class="flex-1 space-y-2">
            <div class="h-4 w-32 bg-surface-container-high animate-pulse rounded"></div>
            <div class="h-3 w-20 bg-surface-container animate-pulse rounded"></div>
          </div>
          <div class="h-5 w-24 bg-surface-container-high animate-pulse rounded"></div>
        </div>
      </div>

      <div class="flex flex-col gap-3" v-else-if="items.length > 0">
        <div
          v-for="item in items"
          :key="item.id"
          class="flex items-center justify-between p-3 bg-surface-container-low rounded-xl group hover:bg-surface-container transition-colors"
        >
          <div class="flex-1">
            <p class="font-medium text-on-surface">{{ item.name }}</p>
            <div class="flex gap-2 text-xs text-secondary">
              <span>{{ item.frequency }}</span>
              <span
                v-if="allowShare && item.share && item.share !== 100"
                class="text-primary font-medium"
              >
                • {{ item.share }}% Share
              </span>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <span class="font-semibold text-on-surface-variant block">
                {{ formatCurrency(item.amount * ((allowShare ? item.share || 100 : 100) / 100)) }}
              </span>
              <span
                v-if="allowShare && item.share && item.share !== 100"
                class="text-xs text-secondary line-through"
              >
                {{ formatCurrency(item.amount) }}
              </span>
            </div>

            <button
              class="text-secondary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity p-1"
              @click="removeItem(item.id)"
            >
              <TrashIcon size="md" />
            </button>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-4 text-sm text-secondary italic">
        No items yet. Add one below.
      </div>
    </div>

    <!-- Add Form -->
    <div class="flex flex-col sm:flex-row gap-2 pt-4 border-t border-outline-variant/50">
      <input
        v-model="newItemName"
        type="text"
        :placeholder="type === 'income' ? 'Name (e.g. Salary)' : 'Name (e.g. Groceries)'"
        class="flex-1 bg-surface-container-high border-0 border-b-2 border-outline-variant/50 focus:border-primary focus:ring-0 rounded-xl px-4 transition-colors text-sm"
        @keyup.enter="addItem"
      />
      <div class="flex gap-2 items-center flex-wrap sm:flex-nowrap">
        <!-- Share Input -->
        <div v-if="allowShare" class="relative w-18 h-full shrink-0">
          <input
            v-model.number="newItemShare"
            type="number"
            min="0"
            max="100"
            step="5"
            placeholder="100"
            class="w-full h-full bg-surface-container-high border-0 border-b-2 border-outline-variant/50 focus:border-primary focus:ring-0 px-4 rounded-xl transition-colors text-sm"
            @keyup.enter="addItem"
          />
          <span
            class="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-secondary font-medium pointer-events-none"
            >%</span
          >
        </div>

        <select
          v-model="newItemFrequency"
          class="h-full bg-surface-container-high border-0 border-outline-variant/50 px-4 rounded-xl transition-colors text-sm"
        >
          <option value="Monthly">Monthly</option>
          <option value="Annual">Annual</option>
        </select>
        <input
          v-model="newItemAmount"
          type="number"
          placeholder="€"
          class="w-24 h-full bg-surface-container-high border-0 border-b-2 border-outline-variant/50 focus:border-primary focus:ring-0 px-4 rounded-xl transition-colors text-sm"
          @keyup.enter="addItem"
        />
        <button
          class="bg-primary/10 text-primary hover:bg-primary/20 p-2.5 rounded-xl transition-colors shrink-0"
          :disabled="!newItemName || !newItemAmount"
          @click="addItem"
        >
          <PlusIcon size="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</template>
