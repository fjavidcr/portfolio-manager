<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg' | string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  class: ''
})

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6'
}

const computedClass =
  typeof props.size === 'string' && props.size in sizeClasses
    ? sizeClasses[props.size as keyof typeof sizeClasses]
    : props.size
</script>

<template>
  <svg
    :class="[computedClass, props.class]"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
    ></path>
  </svg>
</template>
