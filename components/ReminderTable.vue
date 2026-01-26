<script setup lang="ts">
import type { Reminder } from '~/server/db/schema'

const props = defineProps<{
  reminders: Reminder[]
}>()

const emit = defineEmits<{
  edit: [reminder: Reminder]
  delete: [id: string]
  acknowledge: [id: string]
}>()

const columns = [
  { key: 'eventName', label: 'Event' },
  { key: 'eventDateTime', label: 'Date & Time' },
  { key: 'status', label: 'Status' },
  { key: 'config', label: 'Configuration' },
  { key: 'actions', label: 'Actions' }
]

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function statusColor(status: string) {
  switch (status) {
    case 'pending': return 'gray'
    case 'active': return 'orange'
    case 'acknowledged': return 'green'
    default: return 'gray'
  }
}
</script>

<template>
  <UTable :columns="columns" :rows="reminders">
    <template #eventName-data="{ row }">
      <span class="font-medium">{{ row.eventName }}</span>
    </template>

    <template #eventDateTime-data="{ row }">
      <span class="text-sm">{{ formatDate(row.eventDateTime) }}</span>
    </template>

    <template #status-data="{ row }">
      <UBadge :color="statusColor(row.status)" variant="soft">
        {{ row.status }}
      </UBadge>
    </template>

    <template #config-data="{ row }">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        <div>Every {{ row.emailIntervalHours }}h</div>
        <div>{{ row.hoursBeforeStart }}h before</div>
      </div>
    </template>

    <template #actions-data="{ row }">
      <div class="flex gap-2">
        <UButton
          size="xs"
          color="gray"
          variant="soft"
          @click="emit('edit', row)"
        >
          Edit
        </UButton>
        <UButton
          v-if="row.status !== 'acknowledged'"
          size="xs"
          color="green"
          variant="soft"
          @click="emit('acknowledge', row.id)"
        >
          ✓
        </UButton>
        <UButton
          size="xs"
          color="red"
          variant="soft"
          @click="emit('delete', row.id)"
        >
          Delete
        </UButton>
      </div>
    </template>
  </UTable>
</template>
