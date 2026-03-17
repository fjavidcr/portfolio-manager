<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface SelectOption {
  id: string
  label: string
  metadata?: Record<string, any>
}

interface Props {
  options: SelectOption[]
  modelValue: string
  placeholder?: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Seleccionar...',
  label: ''
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const searchQuery = ref('')
const containerRef = ref<HTMLElement | null>(null)

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  const query = searchQuery.value.toLowerCase()
  return props.options.filter(opt => 
    opt.label.toLowerCase().includes(query) || 
    opt.id.toLowerCase().includes(query) ||
    Object.values(opt.metadata || {}).some(val => 
      String(val).toLowerCase().includes(query)
    )
  )
})

const selectedOption = computed(() => 
  props.options.find(opt => opt.id === props.modelValue)
)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
  }
}

const selectOption = (id: string) => {
  emit('update:modelValue', id)
  isOpen.value = false
  searchQuery.value = ''
}

const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="containerRef" class="relative w-full">
    <label v-if="label" class="text-[10px] font-bold text-secondary uppercase tracking-tight block ml-1 mb-1">
      {{ label }}
    </label>
    
    <div 
        @click="toggleDropdown"
        class="flex items-center justify-between px-3 py-2 bg-surface-container-high border border-outline-variant/50 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
        :class="{ 'border-primary ring-1 ring-primary/20': isOpen }"
    >
      <div class="flex-1 truncate">
        <span v-if="selectedOption" class="text-sm font-bold text-on-surface">
          {{ selectedOption.label }}
        </span>
        <span v-else class="text-sm font-medium text-secondary/60">
          {{ placeholder }}
        </span>
      </div>
      <svg 
        class="w-4 h-4 text-secondary transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <!-- Dropdown -->
    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div 
        v-if="isOpen"
        class="absolute z-50 w-full mt-1 bg-surface-container-high border border-outline-variant rounded-xl shadow-xl overflow-hidden"
      >
        <!-- Search Input -->
        <div class="p-2 border-b border-outline-variant/30">
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Buscar..."
            class="w-full px-3 py-1.5 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            @click.stop
            autofocus
          />
        </div>

        <!-- Options List -->
        <div class="max-h-60 overflow-y-auto">
          <div 
            v-for="option in filteredOptions" 
            :key="option.id"
            @click="selectOption(option.id)"
            class="px-3 py-2.5 hover:bg-primary/10 cursor-pointer transition-colors border-b last:border-0 border-outline-variant/10"
          >
            <slot name="option" :option="option">
              <span class="text-sm font-bold text-on-surface">{{ option.label }}</span>
            </slot>
          </div>
          <div v-if="filteredOptions.length === 0" class="px-3 py-4 text-center">
            <span class="text-xs text-secondary italic">No se encontraron resultados</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
