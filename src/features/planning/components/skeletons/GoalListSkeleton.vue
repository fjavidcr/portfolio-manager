<template>
  <div class="bg-surface rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
    <div class="p-6 border-b border-outline-variant/30 flex items-center gap-2">
      <div class="skeleton w-8 h-8 rounded-full opacity-20"></div>
      <div class="skeleton h-6 w-32 opacity-20"></div>
    </div>
    <div class="p-6 space-y-4">
      <div v-for="i in 3" :key="i" class="p-4 bg-surface-container-low rounded-xl">
        <div class="flex items-start justify-between gap-4 mb-4">
          <div class="flex items-center gap-3">
            <div class="skeleton w-10 h-10 rounded-full opacity-10"></div>
            <div class="skeleton h-5 w-40 opacity-20"></div>
          </div>
          <div class="skeleton h-8 w-16 opacity-30"></div>
        </div>
        <div class="skeleton h-14 w-full rounded-xl opacity-10"></div>
      </div>
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
  0% {
    mask-position: 200% 0;
  }
  100% {
    mask-position: -200% 0;
  }
}
</style>
