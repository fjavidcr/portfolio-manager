<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useStore } from '@nanostores/vue';
import { user } from '@features/auth/stores/authStore';
import { db } from '@shared/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs, query } from 'firebase/firestore';
import type { PlatformModel } from '@shared/types';

const props = defineProps<{
  assetId?: string;
}>();

const $user = useStore(user);

const id = ref(props.assetId || '');
const name = ref('');
const type = ref('');
const platformId = ref('');
const currentValue = ref(0);
const loading = ref(!!props.assetId);
const submitting = ref(false);
const error = ref('');
const showDeleteConfirm = ref(false);

const platforms = ref<PlatformModel[]>([]);
const isCreatingPlatform = ref(false);
const newPlatformName = ref('');

const assetTypes = ref<string[]>([]);
const selectedType = ref('');
const customType = ref('');
const isCustomType = ref(false);
const customTypeInput = ref<HTMLInputElement | null>(null);

const toggleCustomType = () => {
    isCustomType.value = !isCustomType.value;
    if (isCustomType.value) {
        // Wait for v-else to render input then focus
        setTimeout(() => customTypeInput.value?.focus(), 50);
        customType.value = ''; // Reset custom input when switching to it
        type.value = '';
    } else {
        selectedType.value = ''; // Reset select if cancelling
        type.value = '';
    }
};

const handleTypeChange = () => {
    type.value = selectedType.value;
};

const handleCustomTypeInput = () => {
    type.value = customType.value;
};

// Sync internal state when `type` changes (e.g. loaded from DB)
watch(type, (newType) => {
    if (!newType) {
        selectedType.value = '';
        isCustomType.value = false;
        return;
    }

    // Check if newType exists in formatted assetTypes (once loaded)
    // We delay slightly or check logic to see if it's a known type
    if (assetTypes.value.includes(newType)) {
        selectedType.value = newType;
        isCustomType.value = false;
    } else {
        // It's a type not in the list (or list not loaded yet). 
        // If list is loaded and it's not there, treat as custom.
        // If list is empty, might differ. 
        // Simplest: If it's not in the list, show as custom input populated
        if (assetTypes.value.length > 0) {
             isCustomType.value = true;
             customType.value = newType;
        } else {
            // types not loaded yet, wait? Or just set custom
            // If we assume types load fast.
        }
    }
});

// Also watch assetTypes to reconcile state once types are loaded
watch(assetTypes, (types) => {
    if (type.value && !types.includes(type.value)) {
        isCustomType.value = true;
        customType.value = type.value;
    } else if (type.value) {
        selectedType.value = type.value;
        isCustomType.value = false;
    }
}, { deep: true });

const fetchAssetTypes = async () => {
    if (!$user.value) return;

    try {
        const assetsRef = collection(db, 'users', $user.value.uid, 'assets');
        const snapshot = await getDocs(assetsRef);
        
        const types = new Set<string>();
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.type) {
                types.add(data.type);
            }
        });

        // Use only DB types, sorted
        assetTypes.value = Array.from(types).sort();
        
        console.log('AddAssetForm: Asset types loaded', assetTypes.value);
    } catch (e) {
        console.error("AddAssetForm: Error fetching asset types:", e);
    }
};

const effectiveAssetId = ref(props.assetId);

const fetchPlatforms = async () => {
  if (!$user.value) {
     console.log('AddAssetForm: Cannot fetch platforms, no user');
     return;
  }
  console.log('AddAssetForm: Fetching platforms for user', $user.value.uid);
  try {
    const platformsRef = collection(db, 'users', $user.value.uid, 'platforms');
    const snapshot = await getDocs(platformsRef);
    platforms.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PlatformModel));
    console.log('AddAssetForm: Platforms loaded', platforms.value.map(p => `${p.name} (${p.id})`));
  } catch (e: any) {
    console.error("AddAssetForm: Error fetching platforms:", e);
    // Explicitly log the code to see if it's 'permission-denied'
    if (e.code) console.error("Error Code:", e.code);
  }
};

const fetchAsset = async (assetId: string) => {
  if (!$user.value || !assetId) {
    console.log('AddAssetForm: Missing user or assetId', { user: !!$user.value, assetId });
    return;
  }
  
  console.log('AddAssetForm: Fetching asset', assetId);
  try {
    const assetRef = doc(db, 'users', $user.value.uid, 'assets', assetId);
    const assetSnap = await getDoc(assetRef);
    
    if (assetSnap.exists()) {
      const data = assetSnap.data();
      console.log('AddAssetForm: Asset data received', JSON.stringify(data, null, 2));
      name.value = data.name || '';
      
      type.value = data.type || '';

      platformId.value = data.platformId || '';
      currentValue.value = data.currentValue || 0;
      id.value = data.id || assetId;
      
      console.log('AddAssetForm: Assigned values:', {
          type: type.value,
          platformId: platformId.value,
          currentValue: currentValue.value,
          platformsCount: platforms.value.length
      });
    } else {
      console.error('AddAssetForm: Asset not found');
      error.value = 'El activo no existe o no tienes permiso para verlo.';
    }
  } catch (e) {
    console.error("AddAssetForm: Error fetching asset:", e);
    error.value = 'Error al cargar el activo.';
  } finally {
    loading.value = false;
  }
};

// Watch for user to be ready to fetch platforms AND asset types
watch($user, (newUser) => {
  if (newUser) {
    fetchPlatforms();
    fetchAssetTypes();
  }
}, { immediate: true });

// Watch for both effectiveAssetId and user to be ready
watch([effectiveAssetId, $user], ([newId, newUser]) => {
  if (newId && newUser) {
    fetchAsset(newId);
  }
}, { immediate: true });

onMounted(() => {
  console.log('AddAssetForm: Mounted', { assetId: props.assetId });
  // In static sites, Astro.url.searchParams doesn't work at runtime.
  // We extract it from window.location.search
  if (!effectiveAssetId.value && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('id');
    if (idFromUrl) {
      console.log('AddAssetForm: Found assetId in URL', idFromUrl);
      effectiveAssetId.value = idFromUrl;
      loading.value = true;
    }
  }
});

const handleSubmit = async () => {
  if (!$user.value) return;
  if (!id.value || !name.value) {
    error.value = 'ID y Nombre son obligatorios.';
    return;
  }

  submitting.value = true;
  error.value = '';

  try {
    const uid = $user.value.uid;
    
    let finalPlatformId = platformId.value;

    // Handle new platform creation
    if (isCreatingPlatform.value && newPlatformName.value.trim()) {
      const pName = newPlatformName.value.trim();
      const pId = pName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      const platformRef = doc(db, 'users', uid, 'platforms', pId);
      await setDoc(platformRef, {
        id: pId,
        name: pName,
        iconUrl: '' // Default empty
      });
      finalPlatformId = pId;
    }

    const assetData = {
      id: id.value.toUpperCase(),
      name: name.value,
      type: type.value, // Save whatever is in the input
      platformId: finalPlatformId,
      currentValue: Number(currentValue.value),
      lastUpdated: serverTimestamp()
    };

    const assetRef = doc(db, 'users', uid, 'assets', id.value.toUpperCase());
    
    if (effectiveAssetId.value) {
      // Edit mode
      await updateDoc(assetRef, assetData);
    } else {
      // Create mode
      const existing = await getDoc(assetRef);
      if (existing.exists()) {
        error.value = 'Ya existe un activo con ese ID (Ticker).';
        submitting.value = false;
        return;
      }
      await setDoc(assetRef, assetData);
    }

    window.location.href = '/assets';
  } catch (e) {
    console.error("Error saving asset:", e);
    error.value = 'Error al guardar el activo.';
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async () => {
  if (!$user.value || !effectiveAssetId.value) return;
  
  submitting.value = true;
  try {
    const assetRef = doc(db, 'users', $user.value.uid, 'assets', effectiveAssetId.value);
    await deleteDoc(assetRef);
    window.location.href = '/assets';
  } catch (e) {
    console.error("Error deleting asset:", e);
    error.value = 'Error al eliminar el activo.';
    showDeleteConfirm.value = false;
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div v-if="loading" class="text-center py-10">
    <svg class="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    <p class="mt-2 text-sm text-gray-400">Cargando activo...</p>
  </div>

  <form v-else @submit.prevent="handleSubmit" class="space-y-6">
    <div v-if="error" class="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
      {{ error }}
    </div>

    <div>
      <label for="id" class="block text-sm font-medium text-gray-400">Símbolo (Ticker / ID)</label>
      <input 
        type="text" 
        id="id" 
        v-model="id" 
        :disabled="!!effectiveAssetId"
        class="mt-2 block w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        placeholder="Ej: AAPL, BTC"
      />
    </div>

    <div>
      <label for="name" class="block text-sm font-medium text-gray-400">Nombre Completo</label>
      <input 
        type="text" 
        id="name" 
        v-model="name" 
        class="mt-2 block w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Ej: Apple Inc."
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div class="flex items-center justify-between mb-2">
            <label for="type" class="block text-sm font-medium text-gray-400">Tipo de Activo</label>
            <button 
                type="button" 
                @click="toggleCustomType"
                class="text-xs text-primary hover:text-primary-hover font-medium"
            >
                {{ isCustomType ? 'Seleccionar existente' : '+ Añadir nuevo' }}
            </button>
        </div>

        <div v-if="!isCustomType">
           <select 
             v-model="selectedType" 
             id="type"
             class="block w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
             @change="handleTypeChange"
           >
             <option value="">Selecciona un tipo</option>
             <option v-for="t in assetTypes" :key="t" :value="t">{{ t }}</option>
           </select>
        </div>

        <div v-else class="space-y-2">
            <input 
                type="text"
                v-model="customType"
                ref="customTypeInput"
                class="block w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Escribe el nuevo tipo (ej: Bonos)"
                @input="handleCustomTypeInput"
            />
            <p class="text-[10px] text-gray-500 italic">Se guardará automáticamente en tu lista de tipos.</p>
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium text-gray-400">Plataforma / Broker</label>
          <button 
            type="button" 
            @click="isCreatingPlatform = !isCreatingPlatform"
            class="text-xs text-primary hover:text-primary-hover font-medium"
          >
            {{ isCreatingPlatform ? 'Seleccionar existente' : '+ Añadir nueva' }}
          </button>
        </div>

        <div v-if="!isCreatingPlatform">
          <select 
            v-model="platformId" 
            class="block w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Selecciona una plataforma</option>
            <option v-for="p in platforms" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>

        <div v-else class="space-y-2">
          <input 
            type="text" 
            v-model="newPlatformName" 
            class="block w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Nombre de la nueva plataforma (ej: Binance)"
          />
          <p class="text-[10px] text-gray-500 italic">Se creará y guardará permanentemente para futuros assets.</p>
        </div>
      </div>
    </div>

    <div>
      <label for="currentValue" class="block text-sm font-medium text-gray-400">Valor Actual (Total)</label>
      <div class="mt-2 relative rounded-lg shadow-sm">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span class="text-gray-500 sm:text-sm">€</span>
        </div>
        <input 
          type="number" 
          id="currentValue" 
          v-model="currentValue" 
          step="0.01"
          class="block w-full pl-8 pr-12 py-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
          placeholder="0.00"
        />
      </div>
    </div>

    <div class="flex flex-col md:flex-row justify-between pt-4 gap-4">
      <div>
        <!-- Debug info (hidden in production) -->
        <div v-if="false" class="text-[8px] text-gray-600 mb-2">
          assetId: {{ effectiveAssetId }} | id: {{ id }}
        </div>
        
        <button 
          v-if="effectiveAssetId" 
          v-show="!showDeleteConfirm"
          type="button" 
          @click="showDeleteConfirm = true"
          class="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
        >
          Eliminar Asset
        </button>
        
        <div v-if="showDeleteConfirm" class="flex items-center gap-3">
          <span class="text-sm text-red-200">¿Estás seguro?</span>
          <button 
            type="button" 
            @click="handleDelete" 
            :disabled="submitting"
            class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-bold disabled:opacity-50"
          >
            SÍ, ELIMINAR
          </button>
          <button 
            type="button" 
            @click="showDeleteConfirm = false"
            class="text-gray-400 hover:text-white text-xs"
          >
            Cancelar
          </button>
        </div>
      </div>

      <div class="flex gap-3">
        <button 
          type="button" 
          onclick="window.history.back()"
          class="px-6 py-3 bg-surface-container-high border border-outline-variant rounded-full text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          :disabled="submitting"
          class="px-6 py-3 bg-primary-container text-on-primary-container rounded-full text-sm font-medium hover:bg-primary transition-colors disabled:opacity-50"
        >
          {{ submitting ? 'Guardando...' : (effectiveAssetId ? 'Guardar Cambios' : 'Añadir Asset') }}
        </button>
      </div>
    </div>
  </form>
</template>
