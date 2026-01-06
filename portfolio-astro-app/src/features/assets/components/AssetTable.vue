<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from '@nanostores/vue';
import { portfolioStore } from '@shared/stores/portfolioStore';
import { formatCurrency, formatDate } from '@shared/lib/utils';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@shared/lib/firebase';
import { user } from '@features/auth/stores/authStore';
import type { TransactionModel } from '@shared/types';

const $portfolio = useStore(portfolioStore);
const $user = useStore(user);
const searchQuery = ref('');
const showArchived = ref(false);
const allTransactions = ref<TransactionModel[]>([]);

const filteredAssets = computed(() => {
  if (!$portfolio.value.assets) return [];
  return $portfolio.value.assets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    asset.id.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Separate active and archived assets
const activeAssets = computed(() => {
  return filteredAssets.value
    .filter(asset => getInvested(asset.id) > 0 && !asset.isArchived)
    .sort((a, b) => getInvested(b.id) - getInvested(a.id)); // Sort by invested amount (descending)
});

const archivedAssets = computed(() => {
  return filteredAssets.value.filter(asset => getInvested(asset.id) === 0 || asset.isArchived);
});

// Load all transactions on mount for accurate calculations
import { watch } from 'vue';

const loadAllTransactions = async () => {
    if (!$user.value) return;
    
    try {
        const txSnapshot = await getDocs(collection(db, 'users', $user.value.uid, 'transactions'));
        allTransactions.value = txSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as TransactionModel));
        console.log(`Loaded ${allTransactions.value.length} transactions for asset calculations`);
    } catch (error) {
        console.error('Error loading all transactions:', error);
    }
};

// Watch for user to be available, then load transactions
watch($user, (newUser) => {
    if (newUser && allTransactions.value.length === 0) {
        loadAllTransactions();
    }
}, { immediate: true });

const hasTransactions = (assetId: string) => {
    if (allTransactions.value.length === 0) return false;
    return allTransactions.value.some(tx => tx.assetId === assetId);
};

const getInvested = (assetId: string) => {
    if (allTransactions.value.length === 0) return 0;
    
    const validTypes = ['Plan', 'Aportación', 'Retirada', 'Dividendo', 'Traspaso', 'Venta']; 
    
    const matchingTransactions = allTransactions.value.filter(tx => {
        return tx.assetId === assetId && validTypes.includes(tx.type);
    });
    
    return matchingTransactions.reduce((sum, tx) => sum + tx.amount, 0);
};

const getProfit = (asset: any) => {
    const invested = getInvested(asset.id);
    return asset.currentValue - invested;
};

const getRoiPercent = (asset: any) => {
    const invested = getInvested(asset.id);
    if (invested === 0) return 0;
    const profit = asset.currentValue - invested;
    return (profit / invested) * 100;
};

const getPlatformName = (platformId: string) => {
    if (!$portfolio.value.platforms) return platformId;
    const platform = $portfolio.value.platforms.find(p => p.id === platformId);
    return platform ? platform.name : platformId;
};

// Archive/Unarchive functions
import { doc, updateDoc } from 'firebase/firestore';

const toggleArchive = async (asset: any) => {
    if (!$user.value) return;
    
    try {
        const assetRef = doc(db, 'users', $user.value.uid, 'assets', asset.id);
        await updateDoc(assetRef, {
            isArchived: !asset.isArchived
        });
    } catch (error) {
        console.error('Error toggling archive status:', error);
    }
};

</script>

<template>
  <div class="bg-surface-container-low shadow rounded-2xl border border-outline-variant p-6">
    <div class="mb-6">
      <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search assets..."
            class="block w-full pl-10 pr-3 py-3 bg-surface border border-outline-variant rounded-full text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
          />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="$portfolio.loading" class="text-center py-10">
         <svg class="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
         <p class="mt-2 text-sm text-gray-400">Loading assets...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="activeAssets.length === 0 && archivedAssets.length === 0" class="text-center py-10 text-gray-400">
        No assets found.
    </div>

    <!-- Active Assets Grid -->
    <div v-else>
      <div v-if="activeAssets.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="asset in activeAssets" 
          :key="asset.id" 
          class="bg-surface-container-low border border-outline-variant rounded-xl p-5 hover:bg-surface-container transition-colors shadow-sm flex flex-col justify-between"
        >
          <!-- Header -->
          <div class="flex justify-between items-start mb-4">
              <div class="min-w-0 flex-1 mr-2">
                  <h3 class="text-lg font-semibold text-on-surface truncate" :title="asset.name">{{ asset.name }}</h3>
                  <p class="text-xs text-secondary font-medium tracking-wide truncate" :title="asset.id">{{ asset.id }}</p>
                  <div class="mt-2 flex gap-2 flex-wrap">
                      <span v-if="asset.platformId" class="px-2 py-0.5 inline-flex text-[10px] font-semibold rounded-full bg-tertiary-container text-on-tertiary-container truncate max-w-full" :title="getPlatformName(asset.platformId)">
                          {{ getPlatformName(asset.platformId) }}
                      </span>
                      <span class="px-2 py-0.5 inline-flex text-[10px] font-semibold rounded-full bg-secondary-container text-on-secondary-container truncate max-w-full">
                          {{ asset.type }}
                      </span>
                      <span v-if="asset.description" class="px-2 py-0.5 inline-flex text-[10px] font-medium text-gray-400 border border-outline-variant rounded-full truncate max-w-full" :title="asset.description">
                          {{ asset.description }}
                      </span>
                  </div>
              </div>
              <div class="flex gap-1">
                  <button @click="toggleArchive(asset)" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-surface-container/50 rounded-full transition-colors flex-shrink-0" title="Archivar">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                      </svg>
                  </button>
                  <a :href="`/edit-asset?id=${asset.id}`" class="p-2 text-primary hover:bg-primary-container/20 rounded-full transition-colors flex-shrink-0" title="Editar">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                  </a>
              </div>
          </div>

          <!-- Main Value -->
          <div class="mb-4">
              <p class="text-xs text-secondary uppercase tracking-widest font-bold">Valor Actual</p>
              <p class="text-3xl font-bold text-on-surface tracking-tight">{{ formatCurrency(asset.currentValue) }}</p>
          </div>

          <!-- Metrics Grid -->
          <div class="grid grid-cols-2 gap-y-3 gap-x-2 border-t border-outline-variant pt-3 text-sm">
              
              <!-- Invested -->
              <div>
                  <p class="text-[10px] text-secondary uppercase font-bold">Invertido</p>
                  <p class="font-medium text-on-surface/80">{{ formatCurrency(getInvested(asset.id)) }}</p>
              </div>

              <!-- Last Update -->
              <div class="text-right">
                  <p class="text-[10px] text-secondary uppercase font-bold">Actualizado</p>
                  <p class="font-medium text-on-surface/60">{{ formatDate(asset.lastUpdated) }}</p>
              </div>

              <!-- ROI € -->
              <div>
                  <p class="text-[10px] text-secondary uppercase font-bold">ROI €</p>
                  <p class="font-bold" :class="getProfit(asset) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                      {{ (getProfit(asset) >= 0 ? '+' : '') + formatCurrency(getProfit(asset)) }}
                  </p>
              </div>

               <!-- ROI % -->
              <div class="text-right">
                  <p class="text-[10px] text-secondary uppercase font-bold">ROI %</p>
                  <p class="font-bold" :class="getRoiPercent(asset) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                       {{ (getRoiPercent(asset) >= 0 ? '+' : '') + getRoiPercent(asset).toFixed(2) }}%
                  </p>
              </div>

          </div>
        </div>
      </div>

      <!-- Archived Assets Section -->
      <div v-if="archivedAssets.length > 0" class="mt-8">
        <!-- Collapsible Header -->
        <button 
          @click="showArchived = !showArchived"
          class="w-full flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant rounded-xl hover:bg-surface-container transition-colors mb-4"
        >
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 text-secondary transition-transform" :class="{ 'rotate-90': showArchived }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
            <h2 class="text-lg font-semibold text-on-surface">Archivados</h2>
            <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary-container text-on-secondary-container">
              {{ archivedAssets.length }}
            </span>
          </div>
          <p class="text-sm text-secondary">Assets sin inversión</p>
        </button>

        <!-- Archived Assets Grid (Collapsible) -->
        <div v-show="showArchived" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
          <div 
            v-for="asset in archivedAssets" 
            :key="asset.id" 
            class="bg-surface-container-low border border-outline-variant rounded-xl p-5 hover:bg-surface-container transition-colors shadow-sm flex flex-col justify-between"
          >
            <!-- Header -->
            <div class="flex justify-between items-start mb-4">
                <div class="min-w-0 flex-1 mr-2">
                    <h3 class="text-lg font-semibold text-on-surface truncate" :title="asset.name">{{ asset.name }}</h3>
                    <p class="text-xs text-secondary font-medium tracking-wide truncate" :title="asset.id">{{ asset.id }}</p>
                    <div class="mt-2 flex gap-2 flex-wrap">
                        <span v-if="asset.platformId" class="px-2 py-0.5 inline-flex text-[10px] font-semibold rounded-full bg-tertiary-container text-on-tertiary-container truncate max-w-full" :title="getPlatformName(asset.platformId)">
                            {{ getPlatformName(asset.platformId) }}
                        </span>
                        <span class="px-2 py-0.5 inline-flex text-[10px] font-semibold rounded-full bg-secondary-container text-on-secondary-container truncate max-w-full">
                            {{ asset.type }}
                        </span>
                        <span v-if="asset.description" class="px-2 py-0.5 inline-flex text-[10px] font-medium text-gray-400 border border-outline-variant rounded-full truncate max-w-full" :title="asset.description">
                            {{ asset.description }}
                        </span>
                    </div>
                </div>
                <div class="flex gap-1">
                    <button @click="toggleArchive(asset)" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-surface-container/50 rounded-full transition-colors flex-shrink-0" title="Desarchivar">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                        </svg>
                    </button>
                    <a :href="`/edit-asset?id=${asset.id}`" class="p-2 text-primary hover:bg-primary-container/20 rounded-full transition-colors flex-shrink-0" title="Editar">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </a>
                </div>
            </div>

            <!-- Main Value -->
            <div class="mb-4">
                <p class="text-xs text-secondary uppercase tracking-widest font-bold">Valor Actual</p>
                <p class="text-3xl font-bold text-on-surface tracking-tight">{{ formatCurrency(asset.currentValue) }}</p>
            </div>

            <!-- Metrics Grid -->
            <div class="grid grid-cols-2 gap-y-3 gap-x-2 border-t border-outline-variant pt-3 text-sm">
                
                <!-- Invested -->
                <div>
                    <p class="text-[10px] text-secondary uppercase font-bold">Invertido</p>
                    <p class="font-medium text-on-surface/80">{{ formatCurrency(getInvested(asset.id)) }}</p>
                </div>

                <!-- Last Update -->
                <div class="text-right">
                    <p class="text-[10px] text-secondary uppercase font-bold">Actualizado</p>
                    <p class="font-medium text-on-surface/60">{{ formatDate(asset.lastUpdated) }}</p>
                </div>

                <!-- ROI € -->
                <div>
                    <p class="text-[10px] text-secondary uppercase font-bold">ROI €</p>
                    <p class="font-medium text-on-surface/60">{{ formatCurrency(0) }}</p>
                </div>

                 <!-- ROI % -->
                <div class="text-right">
                    <p class="text-[10px] text-secondary uppercase font-bold">ROI %</p>
                    <p class="font-medium text-on-surface/60">0.00%</p>
                </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
