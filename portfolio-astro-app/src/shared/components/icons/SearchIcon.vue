<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg' | string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6'
}

const computedClass = typeof props.size === 'string' && props.size in sizeClasses
  ? sizeClasses[props.size as keyof typeof sizeClasses]
  : props.size
</script>

<template>
  <svg
    :class="[computedClass, props.class]"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    ></path>
  </svg>
</template>
