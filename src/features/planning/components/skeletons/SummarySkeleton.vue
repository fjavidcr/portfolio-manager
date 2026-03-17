<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    <div 
        v-for="i in 4" 
        :key="i" 
        class="bg-surface p-5 rounded-2xl border border-outline-variant/30"
    >
      <div class="skeleton h-3 w-24 mb-3 opacity-20"></div>
      <div class="skeleton h-8 w-32 opacity-30 mb-2"></div>
      <div class="skeleton h-2 w-16 opacity-10"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton {
  background-color: currentColor;
  mask-image: linear-gradient(110deg, #000 33%, rgba(0, 0, 0, 0.4) 50%, #000 66%);
  mask-size: 200% 100%;
  animation: skeleton-pulse 1.5s linear infinite;
}

@keyframes skeleton-pulse {
  0% { mask-position: 200% 0; }
  100% { mask-position: -200% 0; }
}
</style>
