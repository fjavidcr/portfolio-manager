<script setup lang="ts">
import type { TransactionType } from '@shared/types'

interface Props {
  type: TransactionType
  size?: 'sm' | 'md' | 'lg' | string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  class: ''
})

const sizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
}

const computedClass =
  typeof props.size === 'string' && props.size in sizeClasses
    ? sizeClasses[props.size as keyof typeof sizeClasses]
    : props.size

const getIconPath = (type: string) => {
  switch (type) {
    case 'Aportación':
    case 'Plan':
      return 'M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-5.94-2.28m5.94 2.28-2.28 5.941'
    case 'Venta':
    case 'Retirada':
      return 'M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 11.854 5.963m0 0-.916 6.32M25.14 14.427 18.82 13.51'
    case 'Dividendo':
      return 'M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
    case 'Traspaso':
      return 'M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5'
    default:
      return 'M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
  }
}
</script>

<template>
  <svg
    :class="[computedClass, props.class]"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    stroke-width="2"
  >
    <path stroke-linecap="round" stroke-linejoin="round" :d="getIconPath(type)"></path>
  </svg>
</template>
