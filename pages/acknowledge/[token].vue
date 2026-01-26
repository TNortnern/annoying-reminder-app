<script setup lang="ts">
const route = useRoute()
const token = route.params.token as string

const { data, error } = await useFetch(`/api/acknowledge/${token}`)

const reminder = computed(() => data.value?.reminder)
const success = computed(() => data.value?.success)
const alreadyAcknowledged = computed(() =>
  data.value?.message?.includes('already acknowledged')
)

const formattedDate = computed(() => {
  if (!reminder.value) return ''
  return new Date(reminder.value.eventDateTime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-4">
    <UCard class="w-full max-w-md">
      <div v-if="error" class="text-center space-y-4">
        <div class="text-6xl">❌</div>
        <h1 class="text-2xl font-bold text-red-600 dark:text-red-400">
          Invalid Token
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          This acknowledgement link is invalid or has expired.
        </p>
      </div>

      <div v-else-if="success" class="text-center space-y-4">
        <div class="text-6xl">
          {{ alreadyAcknowledged ? '✅' : '🎉' }}
        </div>
        <h1 class="text-2xl font-bold text-green-600 dark:text-green-400">
          {{ alreadyAcknowledged ? 'Already Acknowledged' : 'Reminder Acknowledged!' }}
        </h1>

        <div v-if="reminder" class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-left">
          <h2 class="font-semibold text-lg mb-2">{{ reminder.eventName }}</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ formattedDate }}
          </p>
        </div>

        <p class="text-gray-600 dark:text-gray-400">
          {{ alreadyAcknowledged
            ? 'This reminder was already acknowledged. You won\'t receive any more emails.'
            : 'You won\'t receive any more reminder emails for this event.'
          }}
        </p>

        <UButton
          to="/dashboard"
          size="lg"
          block
        >
          View All Reminders
        </UButton>
      </div>
    </UCard>
  </div>
</template>
