<script setup lang="ts">
export interface FilterOption {
  value: string
  label: string
  count?: number
}

interface Props {
  label: string
  id: string
  options: FilterOption[]
  allLabel?: string
}

withDefaults(defineProps<Props>(), {
  allLabel: 'All'
})

const selected = defineModel<string>({ required: true })
</script>

<template>
  <div>
    <label :for="id" class="block text-xs font-medium text-secondary mb-2">
      {{ label }}
    </label>
    <select
      :id="id"
      v-model="selected"
      class="block w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
    >
      <option value="">{{ allLabel }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}{{ option.count !== undefined ? ` (${option.count})` : '' }}
      </option>
    </select>
  </div>
</template>
