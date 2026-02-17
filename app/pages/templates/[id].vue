<template>
  <div v-if="template" class="template-editor">
    <div class="page-header">
      <div class="page-header-left">
        <NuxtLink to="/templates" class="back-btn" title="Back to Templates">
          ← Back
        </NuxtLink>
        <input
          class="editable-title"
          :value="template.name"
          @input="onNameChange"
          @blur="onNameBlur"
          placeholder="Template name…"
        />
        <span class="template-badge">Template</span>
        <span class="page-subtitle">Last updated {{ formatDate(template.updatedAt) }}</span>
      </div>
      <div class="page-header-right">
        <span v-if="store.saving" class="save-indicator">Saving…</span>
        <button class="btn btn-accent" @click="openApplyModal" title="Create estimate from this template">
          📋 Use Template
        </button>
        <button class="btn btn-primary" :disabled="store.saving" @click="saveTemplate">
          💾 Save
        </button>
      </div>
    </div>

    <div class="template-editor-body">
      <!-- Reuse the EstimateTable by passing the data as a virtual estimate -->
      <EstimateTable :estimate="virtualEstimate" />
    </div>

    <!-- Apply Template Modal -->
    <div v-if="showApplyModal" class="modal-overlay" @click.self="showApplyModal = false">
      <div class="modal">
        <h2 class="modal-title">Create Estimate from "{{ template.name }}"</h2>
        <p class="modal-subtitle">This will create a new estimate pre-filled with all groups and features.</p>
        <input
          ref="applyInputRef"
          v-model="applyEstimateName"
          class="modal-input"
          type="text"
          placeholder="New estimate name…"
          @keydown.enter="handleApply"
        />
        <div v-if="applyError" class="apply-error">{{ applyError }}</div>
        <div class="modal-actions">
          <button class="btn btn-ghost" :disabled="applyLoading" @click="showApplyModal = false">Cancel</button>
          <button class="btn btn-primary" :disabled="!applyEstimateName.trim() || applyLoading" @click="handleApply">
            {{ applyLoading ? 'Creating…' : '📋 Create Estimate' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="loadError" class="empty-state" style="height: 100vh;">
    <div class="empty-state-icon">❌</div>
    <h2 class="empty-state-title">Template not found</h2>
    <p class="empty-state-text">This template doesn't exist or may have been deleted.</p>
    <NuxtLink to="/templates" class="btn btn-primary">← Back to Templates</NuxtLink>
  </div>

  <div v-else class="empty-state" style="height: 100vh;">
    <div class="empty-state-icon">⏳</div>
    <h2 class="empty-state-title">Loading template…</h2>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, provide } from 'vue'
import { type Estimate, type EstimateGroup, type EstimateRow, createGroup, createRow, generateId } from '~/stores/estimates'
import type { TableHandler } from '~/composables/useTableHandler'

const route = useRoute()
const router = useRouter()
const store = useTemplatesStore()
const estimatesStore = useEstimatesStore()

const templateId = computed(() => route.params.id as string)
const template = computed(() => store.getTemplate(templateId.value))
const loadError = ref(false)

// Create a virtual estimate object that the EstimateTable component can work with
const virtualEstimate = computed<Estimate>(() => {
  const t = template.value
  if (!t) return { id: '', name: '', createdAt: '', updatedAt: '', groups: [] }
  return {
    id: `tpl-${t.id}`,
    name: t.name,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    groups: t.data,
  }
})

// Provide a custom handler that mutates the template data instead of the estimates store
const tableHandler: TableHandler = {
  addGroup(estimateId: string | number, name = 'New Group') {
    const t = template.value
    if (!t) return
    t.data.push(createGroup(name))
  },
  removeGroup(estimateId: string | number, groupId: string | number) {
    const t = template.value
    if (!t) return
    t.data = t.data.filter(g => String(g.id) !== String(groupId))
  },
  updateGroupName(estimateId: string | number, groupId: string | number, name: string) {
    const t = template.value
    if (!t) return
    const g = t.data.find(g => String(g.id) === String(groupId))
    if (g) g.name = name
  },
  addRow(estimateId: string | number, groupId: string | number) {
    const t = template.value
    if (!t) return
    const g = t.data.find(g => String(g.id) === String(groupId))
    if (g) g.rows.push(createRow())
  },
  removeRow(estimateId: string | number, groupId: string | number, rowId: string | number) {
    const t = template.value
    if (!t) return
    const g = t.data.find(g => String(g.id) === String(groupId))
    if (g) g.rows = g.rows.filter(r => String(r.id) !== String(rowId))
  },
  updateRow(estimateId: string | number, groupId: string | number, rowId: string | number, data: Record<string, any>) {
    const t = template.value
    if (!t) return
    const g = t.data.find(g => String(g.id) === String(groupId))
    if (!g) return
    const r = g.rows.find(r => String(r.id) === String(rowId))
    if (r) Object.assign(r, data)
  },
}

provide('tableHandler', tableHandler)

onMounted(async () => {
  try {
    await store.fetchTemplate(templateId.value)
  } catch {
    loadError.value = true
  }
})

function onNameChange(e: Event) {
  const val = (e.target as HTMLInputElement).value
  const t = template.value
  if (t) t.name = val
}

function onNameBlur(e: FocusEvent) {
  const val = (e.target as HTMLInputElement).value.trim()
  const t = template.value
  if (t && !val) t.name = 'Untitled Template'
}

async function saveTemplate() {
  const t = template.value
  if (!t) return
  await store.updateTemplate(t.id, t.name, t.data)
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

// -- Apply modal --
const showApplyModal = ref(false)
const applyEstimateName = ref('')
const applyLoading = ref(false)
const applyError = ref<string | null>(null)
const applyInputRef = ref<HTMLInputElement | null>(null)

function openApplyModal() {
  applyEstimateName.value = ''
  applyError.value = null
  showApplyModal.value = true
  nextTick(() => applyInputRef.value?.focus())
}

async function handleApply() {
  const name = applyEstimateName.value.trim()
  const t = template.value
  if (!name || !t) return

  applyLoading.value = true
  applyError.value = null

  try {
    const estimate = await store.applyTemplate(t.id, name)
    showApplyModal.value = false
    await estimatesStore.fetchEstimates()
    router.push(`/estimate/${estimate.id}`)
  } catch (e: any) {
    applyError.value = e?.data?.message || e?.message || 'Failed to create estimate.'
  } finally {
    applyLoading.value = false
  }
}
</script>

<style scoped>
.template-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.template-editor-body {
  flex: 1;
  overflow: auto;
  padding: 0 2rem 2rem;
}

.template-badge {
  background: linear-gradient(135deg, #8b5cf680, #6366f180);
  color: #c4b5fd;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-accent {
  padding: 8px 18px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s, box-shadow 0.2s;
}

.btn-accent:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
}

.save-indicator {
  font-size: 0.8rem;
  color: var(--accent-primary);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.modal-subtitle {
  color: var(--text-tertiary);
  font-size: 0.85rem;
  margin: 0.5rem 0 1rem;
  line-height: 1.5;
}

.apply-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}
</style>
