<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
  layout: false
})

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })

    if (response.success) {
      await navigateTo('/dashboard')
    }
  } catch (e: any) {
    error.value = e.data?.message || 'Invalid credentials'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold">🔔 Annoying Reminders</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            Login to manage your reminders
          </p>
        </div>
      </template>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <UFormGroup label="Email" name="email" required>
          <UInput
            v-model="email"
            type="email"
            placeholder="admin@admin.admin"
            size="lg"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup label="Password" name="password" required>
          <UInput
            v-model="password"
            type="password"
            placeholder="Enter password"
            size="lg"
            :disabled="loading"
          />
        </UFormGroup>

        <UAlert
          v-if="error"
          color="red"
          variant="soft"
          :title="error"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid' }"
          @close="error = ''"
        />

        <UButton
          type="submit"
          size="lg"
          block
          :loading="loading"
        >
          Login
        </UButton>
      </form>
    </UCard>
  </div>
</template>
