<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useStore } from '@nanostores/vue'
import { user } from '@features/auth/stores/authStore'
import { portfolioStore, updateTransaction, deleteTransaction } from '@shared/stores/portfolioStore'
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
  addDoc,
  collection
} from 'firebase/firestore'
import { db } from '@shared/lib/firebase'
import {
  TransactionTypes,
  TransactionImpact,
  type TransactionModel,
  type TransactionType
} from '@shared/types'
import LoadingSpinner from '@shared/components/icons/LoadingSpinner.vue'

const props = defineProps<{
  transactionId?: string
}>()

const $user = useStore(user)
const $portfolio = useStore(portfolioStore)

const type = ref<TransactionType>('Plan')
const amount = ref('')
const assetId = ref('')

// Helper to get today's date in local timezone
const getTodayLocal = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const date = ref(getTodayLocal())
const description = ref('')
const submitting = ref(false)

const fetchLoading = ref(false)
const fetchError = ref('')
const dataLoaded = ref(false)
const routeId = ref(props.transactionId)

onMounted(() => {
  if (!routeId.value && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (id) routeId.value = id
  }
})

// Unified watcher to handle initial load and auth state changes
watch(
  [routeId, $user],
  ([newId, newUser]) => {
    if (newId && newUser && !dataLoaded.value) {
      loadTransactionData()
    }
  },
  { immediate: true }
)

const loadTransactionData = async () => {
  if (!routeId.value) return

  fetchLoading.value = true
  fetchError.value = ''

  try {
    // 1. Try store first
    const existing = $portfolio.value.transactions.find((t) => t.id === routeId.value)

    if (existing) {
      applyTransactionData(existing)
    } else {
      // 2. Fetch from Firestore
      if (!$user.value) {
        // Wait for auth... watcher will pick it up,
        // but let's not leave it hanging if auth takes too long or is null
        // We'll leave loading true until auth resolves or timeout
        return
      }

      const docRef = doc(db, 'users', $user.value.uid, 'transactions', routeId.value!)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const txData = docSnap.data()
        applyTransactionData({ id: docSnap.id, ...txData } as TransactionModel)
      } else {
        fetchError.value = 'Transaction not found. It may have been deleted.'
      }
    }
  } catch (e) {
    console.error('Error loading transaction:', e)
    fetchError.value =
      'Error loading transaction: ' + (e instanceof Error ? e.message : 'Unknown error')
  } finally {
    // Only turn off loading if we actually finished or failed.
    // If we returned early for auth, keep it loading (or handle in auth watcher)
    if ($user.value) {
      fetchLoading.value = false
    }
  }
}

const applyTransactionData = (data: Partial<TransactionModel>) => {
  type.value = (data.type ?? 'Plan') as TransactionType
  amount.value = String(data.amount ?? '')
  assetId.value = data.assetId ?? ''
  description.value = data.description || ''

  if (data.date) {
    const d =
      'toDate' in data.date && typeof data.date.toDate === 'function'
        ? data.date.toDate()
        : (data.date as Date)
    date.value = d.toISOString().split('T')[0]
  }
  fetchLoading.value = false // Ensure loading is off
  dataLoaded.value = true
}

const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.'))
    return

  submitting.value = true
  try {
    if (routeId.value) {
      await deleteTransaction(routeId.value)
      window.location.href = '/transactions'
    }
  } catch (e) {
    console.error('Error deleting transaction:', e)
    alert('Error deleting transaction')
  } finally {
    submitting.value = false
  }
}

const handleSubmit = async () => {
  if (!$user.value) return
  submitting.value = true

  try {
    const uid = $user.value.uid
    const txDate = new Date(date.value)

    if (routeId.value) {
      // UPDATE MODE
      const normalizedAmount = Math.abs(Number(amount.value))
      if (normalizedAmount <= 0) {
        alert('Please enter a positive amount')
        submitting.value = false
        return
      }

      await updateTransaction(routeId.value, {
        type: type.value,
        amount: normalizedAmount,
        assetId: assetId.value.toUpperCase(),
        description: description.value,
        date: txDate
      })
    } else {
      // CREATE MODE
      const normalizedAmount = Math.abs(Number(amount.value))
      if (normalizedAmount <= 0) {
        alert('Please enter a positive amount')
        submitting.value = false
        return
      }

      await addDoc(collection(db, 'users', uid, 'transactions'), {
        userId: uid,
        type: type.value,
        amount: normalizedAmount,
        assetId: assetId.value.toUpperCase(),
        description: description.value,
        date: txDate
      })

      // Update Asset Logic (Only for new transactions for now to avoid complexity of rolling back old values)
      // In a perfect world, we calculate asset value from ALL transactions on the fly or cloud functions.
      if (assetId.value) {
        const assetRef = doc(db, 'users', uid, 'assets', assetId.value.toUpperCase())
        const assetSnap = await getDoc(assetRef)

        let valueChange = 0
        const normalizedAmount = Math.abs(Number(amount.value))
        if ((TransactionImpact.Inflow as readonly string[]).includes(type.value)) {
          valueChange = normalizedAmount
        } else if ((TransactionImpact.Outflow as readonly string[]).includes(type.value)) {
          valueChange = -normalizedAmount
        }

        if (assetSnap.exists()) {
          await updateDoc(assetRef, {
            currentValue: increment(valueChange),
            lastUpdated: serverTimestamp()
          })
        }
      }
    }

    window.location.href = '/transactions'
  } catch (e) {
    console.error('Error saving transaction: ', e)
    alert('Error saving transaction')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <!-- Loading State -->
  <div v-if="fetchLoading" class="flex justify-center items-center py-10">
    <LoadingSpinner size="lg" class="text-primary" />
    <span class="ml-2 text-secondary">Loading transaction...</span>
  </div>

  <!-- Error State -->
  <div
    v-else-if="fetchError"
    class="p-4 mb-6 rounded-lg bg-error/10 border border-error/20 text-error flex items-center gap-3"
  >
    <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      ></path>
    </svg>
    <div>
      <p class="font-medium">Error</p>
      <p class="text-sm opacity-90">{{ fetchError }}</p>
    </div>
    <button class="ml-auto text-sm underline hover:no-underline" @click="loadTransactionData">
      Retry
    </button>
  </div>

  <form v-else class="space-y-8" @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Type -->
      <div class="space-y-2">
        <label for="type" class="block text-sm font-medium text-secondary">Transaction Type</label>
        <div class="relative rounded-xl shadow-sm">
          <div
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              ></path>
            </svg>
          </div>
          <select
            id="type"
            v-model="type"
            class="block w-full pl-10 pr-10 py-3 text-on-surface bg-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm rounded-xl appearance-none transition-all duration-200"
          >
            <option v-for="t in TransactionTypes" :key="t" :value="t">{{ t }}</option>
          </select>
          <div
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-secondary"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Asset -->
      <div class="space-y-2">
        <label for="asset" class="block text-sm font-medium text-secondary">Asset</label>
        <div class="relative rounded-xl shadow-sm">
          <div
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              ></path>
            </svg>
          </div>
          <select
            id="asset"
            v-model="assetId"
            class="block w-full pl-10 pr-10 py-3 text-on-surface bg-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm rounded-xl appearance-none transition-all duration-200"
          >
            <option value="" disabled>Select an asset</option>
            <option v-for="asset in $portfolio.assets" :key="asset.id" :value="asset.id">
              {{ asset.name }} - {{ asset.id }}
            </option>
          </select>
          <div
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-secondary"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>
        </div>
        <p v-if="!$portfolio.assets.length" class="mt-1 text-xs text-secondary pl-1">
          No assets found.
          <a href="/add-asset" class="text-primary hover:underline font-medium"
            >Create an asset first</a
          >.
        </p>
      </div>

      <!-- Amount -->
      <div class="space-y-2">
        <label for="amount" class="block text-sm font-medium text-secondary">Amount</label>
        <div class="relative rounded-xl shadow-sm">
          <div
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary"
          >
            <span class="text-lg font-semibold">€</span>
          </div>
          <input
            id="amount"
            v-model="amount"
            type="number"
            name="amount"
            class="block w-full pl-10 pr-3 py-3 text-on-surface bg-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm rounded-xl transition-all duration-200"
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>
      </div>

      <!-- Date -->
      <div class="space-y-2">
        <label for="date" class="block text-sm font-medium text-secondary">Date</label>
        <div class="relative rounded-xl shadow-sm">
          <div
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
          </div>
          <input
            id="date"
            v-model="date"
            type="date"
            name="date"
            class="block w-full pl-10 pr-3 py-3 text-on-surface bg-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm rounded-xl transition-all duration-200"
          />
        </div>
      </div>
    </div>

    <!-- Description (Full Width) -->
    <div class="space-y-2">
      <label for="description" class="block text-sm font-medium text-secondary">Description</label>
      <div class="relative rounded-xl shadow-sm">
        <div class="absolute top-3 left-3 flex items-start pointer-events-none text-secondary">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h7"
            ></path>
          </svg>
        </div>
        <textarea
          id="description"
          v-model="description"
          name="description"
          rows="3"
          maxlength="500"
          class="block w-full pl-10 pr-3 py-3 text-on-surface bg-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm rounded-xl transition-all duration-200"
          placeholder="Optional notes..."
        ></textarea>
      </div>
    </div>

    <!-- Actions -->
    <div
      class="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-6 mt-6 border-t border-outline-variant/50"
    >
      <!-- Delete Button (Only in Edit Mode) -->
      <div class="w-full sm:w-auto">
        <button
          v-if="routeId"
          type="button"
          class="w-full sm:w-auto text-error hover:text-red-700 font-medium text-sm flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-error/5 transition-colors group"
          @click="handleDelete"
        >
          <svg
            class="w-4 h-4 transition-transform group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            ></path>
          </svg>
          Delete
        </button>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <button
          type="button"
          onclick="window.history.back()"
          class="w-full sm:w-auto bg-surface-container-high py-2.5 px-6 border border-outline-variant rounded-full shadow-sm text-sm font-medium text-on-surface hover:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="submitting"
          class="w-full sm:w-auto inline-flex justify-center items-center py-2.5 px-6 border border-transparent shadow text-sm font-medium rounded-full text-on-primary-container bg-primary-container hover:bg-primary-fixed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
        >
          <LoadingSpinner v-if="submitting" size="sm" class="-ml-1 mr-2" />
          {{ routeId ? 'Update Transaction' : 'Save Transaction' }}
        </button>
      </div>
    </div>
  </form>
</template>
