<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useStore } from '@nanostores/vue';
import { user } from '@features/auth/stores/authStore';
import { portfolioStore, updateTransaction, deleteTransaction } from '@shared/stores/portfolioStore';
import { doc, getDoc, updateDoc, increment, serverTimestamp, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@shared/lib/firebase';
import { TransactionTypes } from '@shared/types';

const props = defineProps<{
    transactionId?: string;
}>();

const $user = useStore(user);
const $portfolio = useStore(portfolioStore);

const type = ref('Plan');
const amount = ref('');
const assetId = ref('');
const date = ref(new Date().toISOString().split('T')[0]);
const description = ref('');
const submitting = ref(false);

onMounted(async () => {
    // Initial check
    loadTransactionData();
});

// Watch for store changes (if data loads later)
watch(() => $portfolio.value.transactions, () => {
    loadTransactionData();
});

const loadTransactionData = () => {
    if (props.transactionId && !assetId.value) { // Only load if not already loaded (simple check on assetId)
        const existing = $portfolio.value.transactions.find(t => t.id === props.transactionId);
        
        if (existing) {
            type.value = existing.type;
            amount.value = existing.amount;
            assetId.value = existing.assetId;
            description.value = existing.description || '';
            
            if (existing.date) {
                 const d = existing.date.toDate ? existing.date.toDate() : new Date(existing.date);
                 date.value = d.toISOString().split('T')[0];
            }
        }
    }
};

const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) return;
    
    submitting.value = true;
    try {
        if (props.transactionId) {
            await deleteTransaction(props.transactionId);
            window.location.href = '/transactions';
        }
    } catch (e) {
        console.error("Error deleting transaction:", e);
        alert("Error deleting transaction");
    } finally {
        submitting.value = false;
    }
};

const handleSubmit = async () => {
    if (!$user.value) return;
    submitting.value = true;

    try {
        const uid = $user.value.uid;
        const txDate = new Date(date.value);
        
        if (props.transactionId) {
             // UPDATE MODE
             await updateTransaction(props.transactionId, {
                type: type.value,
                amount: Number(amount.value),
                assetId: assetId.value.toUpperCase(),
                description: description.value,
                date: txDate
             });
        } else {
            // CREATE MODE
            await addDoc(collection(db, 'users', uid, 'transactions'), {
                userId: uid,
                type: type.value,
                amount: Number(amount.value),
                assetId: assetId.value.toUpperCase(),
                description: description.value,
                date: txDate,
            });

            // Update Asset Logic (Only for new transactions for now to avoid complexity of rolling back old values)
             // In a perfect world, we calculate asset value from ALL transactions on the fly or cloud functions.
             if (assetId.value) {
                const assetRef = doc(db, 'users', uid, 'assets', assetId.value.toUpperCase());
                const assetSnap = await getDoc(assetRef);
                
                let valueChange = 0;
                if (['Plan', 'Aportación', 'Dividendo', 'Traspaso'].includes(type.value)) {
                     valueChange = Number(amount.value);
                } else if (['Retirada', 'Venta'].includes(type.value)) {
                     valueChange = -Number(amount.value);
                }

                if (assetSnap.exists()) {
                    await updateDoc(assetRef, {
                        currentValue: increment(valueChange),
                        lastUpdated: serverTimestamp()
                    });
                } else {
                     await setDoc(assetRef, {
                        id: assetId.value.toUpperCase(),
                        name: assetId.value.toUpperCase(),
                        type: 'Stock',
                        currentValue: Number(amount.value),
                        platformId: 'Unknown',
                        lastUpdated: serverTimestamp()
                    });
                }
            }
        }

        window.location.href = '/transactions';

    } catch (e) {
        console.error("Error saving transaction: ", e);
        alert("Error saving transaction");
    } finally {
        submitting.value = false;
    }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div>
      <label for="type" class="block text-sm font-medium text-secondary">Transaction Type</label>
      <select id="type" v-model="type" class="mt-2 block w-full pl-3 pr-10 py-3 text-on-surface bg-surface border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm rounded-lg">
        <option v-for="t in TransactionTypes" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <div>
      <label for="amount" class="block text-sm font-medium text-secondary">Amount</label>
      <div class="mt-2 relative rounded-md shadow-sm">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span class="text-secondary sm:text-sm">€</span>
        </div>
        <input type="number" name="amount" id="amount" v-model="amount" class="focus:ring-primary focus:border-primary block w-full pl-7 pr-12 py-3 sm:text-sm border-outline-variant rounded-lg bg-surface text-on-surface" placeholder="0.00" step="0.01">
      </div>
    </div>

    <div>
      <label for="asset" class="block text-sm font-medium text-secondary">Asset (Ticker)</label>
      <input type="text" name="asset" id="asset" v-model="assetId" class="mt-2 shadow-sm focus:ring-primary focus:border-primary block w-full py-3 sm:text-sm border-outline-variant rounded-lg bg-surface text-on-surface" placeholder="AAPL">
    </div>

    <div>
      <label for="date" class="block text-sm font-medium text-secondary">Date</label>
      <input type="date" name="date" id="date" v-model="date" class="mt-2 shadow-sm focus:ring-primary focus:border-primary block w-full py-3 sm:text-sm border-outline-variant rounded-lg bg-surface text-on-surface">
    </div>

    <div>
      <label for="description" class="block text-sm font-medium text-secondary">Description</label>
      <textarea id="description" name="description" rows="3" v-model="description" class="mt-2 shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-outline-variant rounded-lg bg-surface text-on-surface"></textarea>
    </div>

    <div class="flex justify-between items-center pt-4">
        <!-- Delete Button (Only in Edit Mode) -->
        <div>
             <button v-if="props.transactionId" type="button" @click="handleDelete" class="text-error hover:text-red-700 font-medium text-sm flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-error/5 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                Delete Transaction
             </button>
        </div>

        <div class="flex gap-3">
          <button type="button" class="bg-surface-container-high py-3 px-6 border border-outline-variant rounded-full shadow-sm text-sm font-medium text-on-surface hover:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary" onclick="window.history.back()">
            Cancel
          </button>
          <button type="submit" :disabled="submitting" class="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-full text-on-primary-container bg-primary-container hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
            {{ submitting ? 'Saving...' : (props.transactionId ? 'Update Transaction' : 'Save Transaction') }}
          </button>
        </div>
    </div>
  </form>
</template>
