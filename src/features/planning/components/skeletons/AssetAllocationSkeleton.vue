<template>
  <div class="bg-surface rounded-2xl shadow-sm border border-outline-variant/30">
    <div class="p-6 border-b border-outline-variant/30 flex items-center gap-2">
      <div class="skeleton w-8 h-8 rounded-full opacity-20"></div>
      <div class="skeleton h-6 w-48 opacity-20"></div>
    </div>

    <div class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr class="text-secondary border-b border-outline-variant/30">
            <th v-for="i in 5" :key="i" class="bg-transparent py-4 pl-6">
              <div class="skeleton h-2 w-16 opacity-10"></div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant/20">
          <tr v-for="i in 5" :key="i" class="border-b border-outline-variant/10">
            <td class="pl-6 py-4">
              <div class="flex items-center gap-3">
                <div class="skeleton w-8 h-8 opacity-10"></div>
                <div class="space-y-1">
                  <div class="skeleton h-4 w-32 opacity-20"></div>
                  <div class="skeleton h-3 w-20 opacity-10"></div>
                </div>
              </div>
            </td>
            <td class="py-4"><div class="skeleton h-5 w-24 rounded-full opacity-10"></div></td>
            <td class="py-4"><div class="skeleton h-4 w-32 opacity-20"></div></td>
            <td class="py-4"><div class="skeleton h-8 w-16 opacity-10 ml-auto"></div></td>
            <td class="pr-6 py-4"><div class="skeleton h-5 w-24 opacity-20 ml-auto"></div></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Skeleton Add Form -->
    <div class="p-6 bg-surface-container-low border-t border-outline-variant/30 rounded-b-2xl">
      <div class="flex flex-col sm:flex-row gap-4 items-end">
        <div class="flex-1 w-full"><div class="skeleton h-10 w-full rounded-lg opacity-10"></div></div>
        <div class="flex-1 w-full"><div class="skeleton h-10 w-full rounded-lg opacity-10"></div></div>
        <div class="w-full sm:w-auto"><div class="skeleton h-10 w-32 rounded-lg opacity-20"></div></div>
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
  0% { mask-position: 200% 0; }
  100% { mask-position: -200% 0; }
}
</style>
