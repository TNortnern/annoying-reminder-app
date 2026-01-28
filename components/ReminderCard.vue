<script setup lang="ts">
import type { Reminder } from '~/server/db/schema'

const props = defineProps<{
  reminder: Reminder
}>()

const emit = defineEmits<{
  edit: [reminder: Reminder]
  delete: [id: string]
  acknowledge: [id: string]
}>()

const statusColor = computed(() => {
  switch (props.reminder.status) {
    case 'pending': return 'gray'
    case 'active': return 'orange'
    case 'acknowledged': return 'green'
    default: return 'gray'
  }
})

const formattedDate = computed(() => {
  return new Date(props.reminder.eventDateTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
})
</script>

<template>
  <UCard>
    <div class="space-y-3">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold truncate">
            {{ reminder.eventName }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ formattedDate }}
          </p>
        </div>
        <UBadge :color="statusColor" variant="soft" size="lg">
          {{ reminder.status }}
        </UBadge>
      </div>

      <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
        <p>📧 Every {{ reminder.emailIntervalMinutes }}min</p>
        <p>⏰ Starts {{ reminder.hoursBeforeStart }}h before</p>
      </div>

      <div class="flex gap-2 pt-2">
        <UButton
          size="sm"
          color="gray"
          variant="soft"
          @click="emit('edit', reminder)"
        >
          Edit
        </UButton>
        <UButton
          v-if="reminder.status !== 'acknowledged'"
          size="sm"
          color="green"
          variant="soft"
          @click="emit('acknowledge', reminder.id)"
        >
          Acknowledge
        </UButton>
        <UButton
          size="sm"
          color="red"
          variant="soft"
          @click="emit('delete', reminder.id)"
        >
          Delete
        </UButton>
      </div>
    </div>
  </UCard>
</template>
