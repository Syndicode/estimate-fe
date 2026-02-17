<template>
  <div v-if="estimate" class="estimate-editor">
    <div class="page-header">
      <div class="page-header-left">
        <NuxtLink to="/" class="back-btn" title="Back to Dashboard">
          ← Back
        </NuxtLink>
        <input
          class="editable-title"
          :value="estimate.name"
          @input="onNameChange"
          @blur="onNameBlur"
          placeholder="Estimate name…"
        />
        <span class="page-subtitle">Last updated {{ formatDate(estimate.updatedAt) }}</span>
      </div>
      <div v-if="store.useBackend" class="page-header-right">
        <span v-if="store.saving" class="save-indicator">Saving…</span>
        <button class="btn btn-primary" :disabled="store.saving" @click="saveEstimate">
          💾 Save
        </button>
      </div>
    </div>
    <div class="estimate-editor-body">
      <EstimateTable :estimate="estimate" />
    </div>
  </div>
  <div v-else class="empty-state" style="height: 100vh;">
    <div class="empty-state-icon">🔍</div>
    <h2 class="empty-state-title">Estimate not found</h2>
    <p class="empty-state-text">This estimate doesn't exist or may have been deleted.</p>
    <NuxtLink to="/" class="btn btn-primary">← Back to Dashboard</NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const store = useEstimatesStore()

onMounted(() => store.init())

const estimateId = computed(() => route.params.id as string)
const estimate = computed(() => store.getEstimate(estimateId.value))

function onNameChange(e: Event) {
  const val = (e.target as HTMLInputElement).value
  store.updateEstimateName(estimateId.value, val)
}

function onNameBlur(e: FocusEvent) {
  const val = (e.target as HTMLInputElement).value.trim()
  if (!val) {
    store.updateEstimateName(estimateId.value, 'Untitled Estimate')
  }
}

async function saveEstimate() {
  if (estimate.value) {
    await store.saveEstimateToApi(estimate.value)
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.save-indicator {
  font-size: 0.8rem;
  color: var(--accent-primary);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>

