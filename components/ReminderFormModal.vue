<script setup lang="ts">
import { z } from 'zod'
import type { Reminder } from '~/server/db/schema'

const props = defineProps<{
  isOpen: boolean
  reminder?: Reminder | null
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const isEdit = computed(() => !!props.reminder)

const form = reactive({
  eventName: '',
  eventDateTime: '',
  emailRecipients: '',
  hoursBeforeStart: 6,
  emailIntervalMinutes: 10
})

const loading = ref(false)
const error = ref('')

// Populate form when editing
watch(() => props.reminder, (reminder) => {
  if (reminder) {
    form.eventName = reminder.eventName
    form.eventDateTime = new Date(reminder.eventDateTime).toISOString().slice(0, 16)
    form.emailRecipients = reminder.emailRecipients?.join(', ') || ''
    form.hoursBeforeStart = reminder.hoursBeforeStart
    form.emailIntervalMinutes = reminder.emailIntervalMinutes
  }
}, { immediate: true })

// Reset form when modal closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen && !props.reminder) {
    form.eventName = ''
    form.eventDateTime = ''
    form.emailRecipients = ''
    form.hoursBeforeStart = 6
    form.emailIntervalMinutes = 10
    error.value = ''
  }
})

const intervalOptions = [
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '60 minutes' }
]

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    // Validate datetime is in future
    const eventDate = new Date(form.eventDateTime)
    if (eventDate <= new Date()) {
      error.value = 'Event must be in the future'
      loading.value = false
      return
    }

    // Parse email recipients from comma-separated string
    const emailRecipients = form.emailRecipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0)

    if (emailRecipients.length === 0) {
      error.value = 'At least one email recipient is required'
      loading.value = false
      return
    }

    const body = {
      eventName: form.eventName,
      eventDateTime: eventDate.toISOString(),
      emailRecipients,
      hoursBeforeStart: form.hoursBeforeStart,
      emailIntervalMinutes: form.emailIntervalMinutes
    }

    if (isEdit.value && props.reminder) {
      await $fetch(`/api/reminders/${props.reminder.id}`, {
        method: 'PATCH',
        body
      })
    } else {
      await $fetch('/api/reminders', {
        method: 'POST',
        body
      })
    }

    emit('success')
    emit('close')
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to save reminder'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal :model-value="isOpen" @update:model-value="emit('close')">
    <UCard>
      <template #header>
        <h3 class="text-xl font-bold">
          {{ isEdit ? 'Edit Reminder' : 'Create Reminder' }}
        </h3>
      </template>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <UFormGroup label="Event Name" name="eventName" required>
          <UInput
            v-model="form.eventName"
            placeholder="Doctor appointment"
            size="lg"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup label="Event Date & Time" name="eventDateTime" required>
          <UInput
            v-model="form.eventDateTime"
            type="datetime-local"
            size="lg"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup
          label="Email Recipients"
          name="emailRecipients"
          help="Comma-separated email addresses (e.g., john@example.com, jane@example.com)"
          required
        >
          <UInput
            v-model="form.emailRecipients"
            placeholder="your@email.com, another@email.com"
            size="lg"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup
          label="Hours Before Event"
          name="hoursBeforeStart"
          help="When should reminders start?"
        >
          <UInput
            v-model.number="form.hoursBeforeStart"
            type="number"
            :min="0"
            :max="168"
            size="lg"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup
          label="Email Interval"
          name="emailIntervalMinutes"
          help="How often should we send reminders?"
        >
          <USelectMenu
            v-model="form.emailIntervalMinutes"
            :options="intervalOptions"
            option-attribute="label"
            value-attribute="value"
            size="lg"
            :disabled="loading"
          />
        </UFormGroup>

        <UAlert
          v-if="error"
          color="red"
          variant="soft"
          :title="error"
        />

        <div class="flex gap-3">
          <UButton
            type="submit"
            size="lg"
            :loading="loading"
            class="flex-1"
          >
            {{ isEdit ? 'Update' : 'Create' }}
          </UButton>
          <UButton
            type="button"
            color="gray"
            variant="soft"
            size="lg"
            @click="emit('close')"
            :disabled="loading"
          >
            Cancel
          </UButton>
        </div>
      </form>
    </UCard>
  </UModal>
</template>
