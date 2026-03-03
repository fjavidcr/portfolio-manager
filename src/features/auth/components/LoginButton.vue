<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { user, signInWithGoogle, authLoading, authError } from '@features/auth/stores/authStore'
import GoogleIcon from '@shared/components/icons/GoogleIcon.vue'
import { watchEffect } from 'vue'

const $user = useStore(user)
const $loading = useStore(authLoading)
const $error = useStore(authError)

const handleLogin = async () => {
  await signInWithGoogle()
}

watchEffect(() => {
  if ($user.value) {
    window.location.href = '/'
  }
})
</script>

<template>
  <div class="w-full">
    <div
      v-if="$error"
      class="mb-4 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded relative"
      role="alert"
    >
      <span class="block sm:inline">{{ $error }}</span>
    </div>

    <button
      :disabled="$loading"
      class="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-gray-900 bg-white hover:bg-gray-100 md:py-4 md:text-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
      @click="handleLogin"
    >
      <span v-if="$loading" class="mr-2">Connecting...</span>
      <span v-else class="flex items-center">
        <GoogleIcon class="mr-3" />
        Sign in with Google
      </span>
    </button>
  </div>
</template>
