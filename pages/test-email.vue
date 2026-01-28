<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const emailTo = ref('traynorthern96@gmail.com')
const isSending = ref(false)
const result = ref<{ success: boolean; message: string } | null>(null)

async function sendTestEmail() {
  isSending.value = true
  result.value = null
  
  try {
    const response = await $fetch('/api/test-email', {
      method: 'POST',
      body: { emailTo: emailTo.value }
    })
    
    result.value = {
      success: true,
      message: `✓ Test email sent successfully to ${emailTo.value}!`
    }
  } catch (error: any) {
    result.value = {
      success: false,
      message: `✗ Failed to send email: ${error.message || 'Unknown error'}`
    }
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-arrow-left"
              to="/dashboard"
            >
              Back
            </UButton>
            <h1 class="text-2xl font-bold">📧 Test Email</h1>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <UCard class="max-w-lg mx-auto">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-envelope" class="text-xl" />
            <h2 class="text-lg font-semibold">Send Test Email</h2>
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Recipient Email" hint="Where to send the test">
            <UInput
              v-model="emailTo"
              type="email"
              placeholder="traynorthern96@gmail.com"
              icon="i-heroicons-envelope"
            />
          </UFormGroup>

          <div class="flex items-center gap-2 text-sm text-gray-500">
            <UIcon name="i-heroicons-information-circle" />
            <span>This will send a test reminder email via the Email Gateway</span>
          </div>

          <UAlert
            v-if="result"
            :color="result.success ? 'green' : 'red'"
            :title="result.success ? 'Success' : 'Error'"
            :description="result.message"
            variant="soft"
          />

          <UButton
            block
            size="lg"
            :loading="isSending"
            :disabled="isSending || !emailTo"
            @click="sendTestEmail"
          >
            <template #leading>
              <UIcon name="i-heroicons-paper-airplane" />
            </template>
            {{ isSending ? 'Sending...' : 'Send Test Email' }}
          </UButton>
        </div>
      </UCard>

      <!-- Environment Info -->
      <UCard class="max-w-lg mx-auto mt-6">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-server" class="text-xl" />
            <h2 class="text-lg font-semibold">Environment Status</h2>
          </div>
        </template>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">App URL:</span>
            <code class="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">
              https://annoying-reminder-app-production.up.railway.app
            </code>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Email Gateway:</span>
            <UBadge color="green" size="xs">Configured</UBadge>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">From:</span>
            <span>Prob &lt;prob@tnorthern.com&gt;</span>
          </div>
        </div>
      </UCard>
    </main>
  </div>
</template>
