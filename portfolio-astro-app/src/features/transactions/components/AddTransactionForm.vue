<script setup lang="ts">
import { ref } from 'vue';
import { useStore } from '@nanostores/vue';
import { user } from '@features/auth/stores/authStore';
import { db } from '@shared/lib/firebase';
import { collection, addDoc, doc, setDoc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { TransactionTypes, type AssetModel } from '@shared/types';

const $user = useStore(user);

const type = ref(TransactionTypes[0]);
const amount = ref(0);
const assetId = ref('');
const description = ref('');
const date = ref(new Date().toISOString().split('T')[0]);
const submitting = ref(false);

const handleSubmit = async () => {
    if (!$user.value) return;
    submitting.value = true;

    try {
        const uid = $user.value.uid;
        const txDate = new Date(date.value);
        
        // 1. Add Transaction
        await addDoc(collection(db, 'users', uid, 'transactions'), {
            userId: uid,
            type: type.value,
            amount: Number(amount.value),
            assetId: assetId.value.toUpperCase(),
            description: description.value,
            date: txDate,
        });

        // 2. Update or Create Asset (Simple Logic)
        // If it's a 'Buy' or 'Aportación', we increase value. If 'Sell', decrease.
        // For simplicity, we just track 'currentValue' as a raw sum for now, matching the simplified logic.
        // In a real app, we'd calculate shares * price.
        // The Flutter app's `AssetService.updateAssetValue` updates `currentValue`.
        // We'll mimic basic asset updating.
        
        if (assetId.value) {
            const assetRef = doc(db, 'users', uid, 'assets', assetId.value.toUpperCase());
            const assetSnap = await getDoc(assetRef);
            
            let valueChange = 0;
             // Naive logic: Buy/Deposit/Dividend adds to value. Sell/Withdrawal subtracts.
            if (['Plan', 'Aportación', 'Dividendo', 'Traspaso'].includes(type.value)) { // Traspaso is tricky
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
                // Create new asset if not exists
                 await setDoc(assetRef, {
                    id: assetId.value.toUpperCase(),
                    name: assetId.value.toUpperCase(), // Placeholder name
                    type: 'Stock', // Default
                    currentValue: Number(amount.value),
                    platformId: 'Unknown',
                    lastUpdated: serverTimestamp()
                });
            }
        }

        window.location.href = '/transactions';

    } catch (e) {
        console.error("Error adding transaction: ", e);
        alert("Error saving transaction");
    } finally {
        submitting.value = false;
    }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div>
      <label for="type" class="block text-sm font-medium text-gray-400">Transaction Type</label>
      <select id="type" v-model="type" class="mt-2 block w-full pl-3 pr-10 py-3 text-on-surface bg-surface border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm rounded-lg">
        <option v-for="t in TransactionTypes" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <div>
      <label for="amount" class="block text-sm font-medium text-gray-400">Amount</label>
      <div class="mt-2 relative rounded-md shadow-sm">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span class="text-gray-500 sm:text-sm">€</span>
        </div>
        <input type="number" name="amount" id="amount" v-model="amount" class="focus:ring-primary focus:border-primary block w-full pl-7 pr-12 py-3 sm:text-sm border-outline-variant rounded-lg bg-surface text-on-surface" placeholder="0.00" step="0.01">
      </div>
    </div>

    <div>
      <label for="asset" class="block text-sm font-medium text-gray-400">Asset (Ticker)</label>
      <input type="text" name="asset" id="asset" v-model="assetId" class="mt-2 shadow-sm focus:ring-primary focus:border-primary block w-full py-3 sm:text-sm border-outline-variant rounded-lg bg-surface text-on-surface" placeholder="AAPL">
    </div>

    <div>
      <label for="date" class="block text-sm font-medium text-gray-400">Date</label>
      <input type="date" name="date" id="date" v-model="date" class="mt-2 shadow-sm focus:ring-primary focus:border-primary block w-full py-3 sm:text-sm border-outline-variant rounded-lg bg-surface text-on-surface">
    </div>

    <div>
      <label for="description" class="block text-sm font-medium text-gray-400">Description</label>
      <textarea id="description" name="description" rows="3" v-model="description" class="mt-2 shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-outline-variant rounded-lg bg-surface text-on-surface"></textarea>
    </div>

    <div class="flex justify-end pt-4">
      <button type="button" class="bg-surface-container-high py-3 px-6 border border-outline-variant rounded-full shadow-sm text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 mr-3" onclick="window.history.back()">
        Cancel
      </button>
      <button type="submit" :disabled="submitting" class="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-full text-on-primary-container bg-primary-container hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
        {{ submitting ? 'Saving...' : 'Save' }}
      </button>
    </div>
  </form>
</template>
