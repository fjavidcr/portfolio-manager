<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BudgetItem, BudgetFrequency } from '@shared/types'
import TrashIcon from '@shared/components/icons/TrashIcon.vue'
import EditIcon from '@shared/components/icons/EditIcon.vue'
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
const newItemAmount = ref<number | ''>('')
const newItemFrequency = ref<BudgetFrequency>('Monthly')
const newItemShare = ref<number>(100)
const editingItemId = ref<string | null>(null)

const directMonthlyTotal = computed(() => {
  return props.items.reduce((sum, item) => {
    if (item.frequency === 'Annual') return sum
    let amount = item.amount
    if (props.allowShare && item.share !== undefined) {
      amount = amount * (item.share / 100)
    }
    return sum + amount
  }, 0)
})

const annualReserveMonthlyTotal = computed(() => {
  return props.items.reduce((sum, item) => {
    if (item.frequency !== 'Annual') return sum
    let amount = item.amount
    if (props.allowShare && item.share !== undefined) {
      amount = amount * (item.share / 100)
    }
    return sum + amount / 12
  }, 0)
})

const totalMonthly = computed(() => directMonthlyTotal.value + annualReserveMonthlyTotal.value)

const estimatedMonthlyReserve = computed(() => {
  if (newItemFrequency.value !== 'Annual' || !newItemAmount.value) return 0
  const share = props.allowShare ? (newItemShare.value ?? 100) : 100
  return (Number(newItemAmount.value) * (share / 100)) / 12
})

const editItem = (item: BudgetItem) => {
  editingItemId.value = item.id
  newItemName.value = item.name
  newItemAmount.value = item.amount
  newItemFrequency.value = item.frequency ?? 'Monthly'
  newItemShare.value = item.share ?? 100
}

const cancelEdit = () => {
  editingItemId.value = null
  newItemName.value = ''
  newItemAmount.value = ''
  newItemFrequency.value = 'Monthly'
  newItemShare.value = 100
}

const addItem = () => {
  if (!newItemName.value || !newItemAmount.value) return

  if (editingItemId.value) {
    const updatedItems = props.items.map((i) => {
      if (i.id === editingItemId.value) {
        return {
          ...i,
          name: newItemName.value,
          amount: Number(newItemAmount.value),
          frequency: newItemFrequency.value,
          share: props.allowShare ? newItemShare.value : 100
        }
      }
      return i
    })
    emit('update:items', updatedItems)
  } else {
    const newItem: BudgetItem = {
      id: crypto.randomUUID(),
      name: newItemName.value,
      amount: Number(newItemAmount.value),
      frequency: newItemFrequency.value,
      share: props.allowShare ? newItemShare.value : 100
    }
    emit('update:items', [...props.items, newItem])
  }

  // Reset form
  cancelEdit()
}

const removeItem = (id: string) => {
  emit(
    'update:items',
    props.items.filter((i) => i.id !== id)
  )
}
</script>

<template>
  <div class="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant/30">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h3 class="text-lg font-bold text-on-surface">{{ title }}</h3>
        <p
          v-if="type === 'expense' && annualReserveMonthlyTotal > 0 && !loading"
          class="text-xs text-secondary mt-0.5"
        >
          Directo: <span class="font-semibold">{{ formatCurrency(directMonthlyTotal) }}</span> •
          Reserva anual:
          <span class="font-semibold text-amber-600 dark:text-amber-400"
            >{{ formatCurrency(annualReserveMonthlyTotal) }}/mes</span
          >
        </p>
      </div>
      <span class="text-sm font-medium text-secondary text-right">
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

      <div v-else-if="items.length > 0" class="flex flex-col gap-3">
        <div
          v-for="item in items"
          :key="item.id"
          class="flex items-center justify-between p-3 bg-surface-container-low rounded-xl group hover:bg-surface-container transition-colors"
        >
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <p class="font-medium text-on-surface">{{ item.name }}</p>
              <span
                v-if="type === 'expense' && item.frequency === 'Annual'"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              >
                Anual (Reserva)
              </span>
              <span
                v-else-if="type === 'expense'"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-container-high text-secondary"
              >
                Mensual
              </span>
            </div>
            <div class="flex gap-2 text-xs text-secondary mt-0.5">
              <span>{{ item.frequency === 'Annual' ? 'Anual' : 'Mensual' }}</span>
              <span
                v-if="allowShare && item.share && item.share !== 100"
                class="text-primary font-medium"
              >
                • {{ item.share }}% Cuota
              </span>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <template v-if="item.frequency === 'Annual'">
                <span class="font-semibold text-on-surface-variant block">
                  {{ formatCurrency(item.amount * ((allowShare ? item.share || 100 : 100) / 100)) }}
                  / año
                </span>
                <span class="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                  {{
                    formatCurrency(
                      (item.amount * ((allowShare ? item.share || 100 : 100) / 100)) / 12
                    )
                  }}
                  / mes (ahorro)
                </span>
              </template>
              <template v-else>
                <span class="font-semibold text-on-surface-variant block">
                  {{ formatCurrency(item.amount * ((allowShare ? item.share || 100 : 100) / 100)) }}
                  / mes
                </span>
              </template>
              <span
                v-if="allowShare && item.share && item.share !== 100"
                class="text-xs text-secondary line-through block"
              >
                {{ formatCurrency(item.amount) }}
              </span>
            </div>
            <button
              class="text-secondary hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1"
              title="Edit"
              @click="editItem(item)"
            >
              <EditIcon size="md" />
            </button>
            <button
              class="text-secondary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity p-1"
              title="Delete"
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
    <div class="flex flex-col gap-2 pt-4 border-t border-outline-variant/50 transition-colors">
      <div
        class="flex flex-col sm:flex-row gap-2"
        :class="
          editingItemId ? 'bg-primary/5 -mx-6 px-6 py-2 rounded-b-2xl border-t-primary/20' : ''
        "
      >
        <input
          v-model="newItemName"
          type="text"
          maxlength="50"
          :placeholder="
            editingItemId
              ? 'Edit Name'
              : type === 'income'
                ? 'Name (e.g. Salary)'
                : 'Name (e.g. Groceries)'
          "
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
            <option value="Monthly">Mensual</option>
            <option value="Annual">Anual</option>
          </select>
          <input
            v-model="newItemAmount"
            type="number"
            min="0"
            max="10000000000"
            placeholder="€"
            class="w-28 h-full bg-surface-container-high border-0 border-b-2 border-outline-variant/50 focus:border-primary focus:ring-0 px-4 rounded-xl transition-colors text-sm"
            @keyup.enter="addItem"
          />
          <button
            v-if="editingItemId"
            class="text-secondary hover:bg-surface-container p-2.5 rounded-xl transition-colors shrink-0 font-medium text-sm"
            @click="cancelEdit"
          >
            Cancel
          </button>
          <button
            class="p-2.5 rounded-xl transition-colors shrink-0 flex items-center justify-center min-w-[40px]"
            :class="
              editingItemId
                ? 'bg-primary text-on-primary hover:bg-primary/90'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            "
            :disabled="!newItemName || !newItemAmount"
            @click="addItem"
          >
            <span v-if="editingItemId" class="text-sm font-medium px-2">Save</span>
            <PlusIcon v-else size="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        v-if="newItemFrequency === 'Annual' && newItemAmount"
        class="text-xs text-amber-600 dark:text-amber-400 font-medium px-1"
      >
        💡 Provisión mensual a reservar: {{ formatCurrency(estimatedMonthlyReserve) }}/mes
      </div>
    </div>
  </div>
</template>
