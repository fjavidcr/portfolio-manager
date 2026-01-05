<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import { user, logout } from '../stores/authStore';

const $user = useStore(user);

const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
};
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
            <div v-else class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
                {{ $user.displayName?.[0] || 'U' }}
            </div>
            
            <div class="overflow-hidden">
                <p class="text-sm font-medium text-on-surface truncate">{{ $user.displayName }}</p>
                <p class="text-xs text-gray-400 truncate">{{ $user.email }}</p>
            </div>
        </div>

        <button
            @click="handleLogout"
            class="flex w-full items-center px-4 py-3 text-sm font-medium rounded-full text-error hover:bg-error-container hover:text-on-error-container transition-colors"
        >
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Logout
        </button>
    </div>
</template>
