<script setup lang="ts">
import type { Reminder } from '~/server/db/schema'

definePageMeta({
  middleware: 'auth'
})

const { data: remindersData, refresh } = await useFetch('/api/reminders')

const reminders = computed(() => remindersData.value?.reminders || [])

const isModalOpen = ref(false)
const editingReminder = ref<Reminder | null>(null)

async function handleLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}

function openCreateModal() {
  editingReminder.value = null
  isModalOpen.value = true
}

function openEditModal(reminder: Reminder) {
  editingReminder.value = reminder
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  editingReminder.value = null
}

async function handleSuccess() {
  await refresh()
}

async function handleDelete(id: string) {
  if (confirm('Are you sure you want to delete this reminder?')) {
    await $fetch(`/api/reminders/${id}`, { method: 'DELETE' })
    await refresh()
  }
}

async function handleAcknowledge(id: string) {
  await $fetch(`/api/reminders/${id}`, {
    method: 'PATCH',
    body: { status: 'acknowledged' }
  })
  await refresh()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">🔔 Annoying Reminders</h1>
          <UButton
            color="gray"
            variant="soft"
            @click="handleLogout"
          >
            Logout
          </UButton>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6">
        <UButton
          size="lg"
          @click="openCreateModal"
        >
          + Create Reminder
        </UButton>
      </div>

      <div v-if="reminders.length === 0" class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400 text-lg">
          No reminders yet. Create one to get started!
        </p>
      </div>

      <div v-else>
        <!-- Desktop: Table -->
        <div class="hidden lg:block">
          <ReminderTable
            :reminders="reminders"
            @edit="openEditModal"
            @delete="handleDelete"
            @acknowledge="handleAcknowledge"
          />
        </div>

        <!-- Mobile: Cards -->
        <div class="lg:hidden grid gap-4">
          <ReminderCard
            v-for="reminder in reminders"
            :key="reminder.id"
            :reminder="reminder"
            @edit="openEditModal"
            @delete="handleDelete"
            @acknowledge="handleAcknowledge"
          />
        </div>
      </div>
    </main>

    <ReminderFormModal
      :is-open="isModalOpen"
      :reminder="editingReminder"
      @close="closeModal"
      @success="handleSuccess"
    />
  </div>
</template>
