<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import LogoutIcon from '@shared/components/icons/LogoutIcon.vue'
import { user, logout } from '../stores/authStore'

const $user = useStore(user)

const handleLogout = async () => {
  await logout()
  window.location.href = '/login'
}
</script>

<template>
  <div class="border-t border-outline-variant p-4">
    <div v-if="$user" class="flex items-center gap-3 mb-3">
      <img
        v-if="$user.photoURL"
        :src="$user.photoURL"
        alt="User Avatar"
        class="w-10 h-10 rounded-full border border-outline-variant"
      />
      <div
        v-else
        class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold"
      >
        {{ $user.displayName?.[0] || 'U' }}
      </div>

      <div class="overflow-hidden">
        <p class="text-sm font-medium text-on-surface truncate">{{ $user.displayName }}</p>
        <p class="text-xs text-gray-400 truncate">{{ $user.email }}</p>
      </div>
    </div>

    <button
      class="flex w-full items-center px-4 py-3 text-sm font-medium rounded-full text-error hover:bg-error-container hover:text-on-error-container transition-colors"
      @click="handleLogout"
    >
      <LogoutIcon class="mr-3" />
      Logout
    </button>
  </div>
</template>
