<template>
  <div>
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">📝 Templates</h1>
        <span class="page-subtitle">{{ templates.length }} template{{ templates.length !== 1 ? 's' : '' }}</span>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" @click="showCreateModal = true">
          ＋ New Template
        </button>
      </div>
    </div>

    <div class="dashboard animate-fade-in">
      <!-- Loading -->
      <div v-if="store.loading" class="empty-state">
        <div class="empty-state-icon">⏳</div>
        <h2 class="empty-state-title">Loading templates…</h2>
      </div>

      <!-- Empty state -->
      <div v-else-if="templates.length === 0" class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h2 class="empty-state-title">No templates yet</h2>
        <p class="empty-state-text">
          Create reusable templates to quickly bootstrap new estimates. Define groups, features, and default hour values once, then reuse them for every new project.
        </p>
        <button class="btn btn-primary" @click="showCreateModal = true">
          ＋ Create First Template
        </button>
      </div>

      <!-- Templates grid -->
      <div v-else class="estimates-grid">
        <div
          v-for="tpl in templates"
          :key="tpl.id"
          class="card estimate-card template-card animate-slide-up"
        >
          <div class="estimate-card-header">
            <div class="estimate-card-title">{{ tpl.name }}</div>
            <div class="estimate-card-date">{{ formatDate(tpl.updatedAt) }}</div>
          </div>

          <div class="template-card-stats">
            <span class="template-stat">
              {{ tpl.data.length }} group{{ tpl.data.length !== 1 ? 's' : '' }}
            </span>
            <span class="template-stat-separator">·</span>
            <span class="template-stat">
              {{ totalRows(tpl) }} feature{{ totalRows(tpl) !== 1 ? 's' : '' }}
            </span>
          </div>

          <div class="template-card-actions">
            <button class="btn btn-sm btn-ghost" @click="goToTemplate(tpl.id)" title="View / Edit">
              ✏️ Edit
            </button>
            <button class="btn btn-sm btn-accent" @click="openApplyModal(tpl)" title="Create estimate from this template">
              📋 Use Template
            </button>
            <button
              class="btn btn-icon btn-icon-sm btn-danger-ghost"
              title="Delete template"
              @click.stop="confirmDelete(tpl.id)"
            >
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Template Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <h2 class="modal-title">Create New Template</h2>
        <input
          ref="createInputRef"
          v-model="newTemplateName"
          class="modal-input"
          type="text"
          placeholder="e.g. E-Commerce MVP, SaaS Platform…"
          @keydown.enter="handleCreate"
        />
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showCreateModal = false">Cancel</button>
          <button class="btn btn-primary" :disabled="!newTemplateName.trim()" @click="handleCreate">
            Create
          </button>
        </div>
      </div>
    </div>

    <!-- Apply Template Modal -->
    <div v-if="showApplyModal" class="modal-overlay" @click.self="showApplyModal = false">
      <div class="modal">
        <h2 class="modal-title">Create Estimate from "{{ applyingTemplate?.name }}"</h2>
        <p class="modal-subtitle">This will create a new estimate pre-filled with all groups and features from this template.</p>
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
</template>

<script setup lang="ts">
import { ref, nextTick, computed, watch } from 'vue'
import type { Template } from '~/stores/templates'

const store = useTemplatesStore()
const estimatesStore = useEstimatesStore()
const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  await store.fetchTemplates()
})

const templates = computed(() => store.templatesList)

// -- Create modal --
const showCreateModal = ref(false)
const newTemplateName = ref('')
const createInputRef = ref<HTMLInputElement | null>(null)

watch(showCreateModal, async (val) => {
  if (val) {
    newTemplateName.value = ''
    await nextTick()
    createInputRef.value?.focus()
  }
})

async function handleCreate() {
  const name = newTemplateName.value.trim()
  if (!name) return
  const tpl = await store.createTemplate(name)
  showCreateModal.value = false
  router.push(`/templates/${tpl.id}`)
}

// -- Apply (use template) modal --
const showApplyModal = ref(false)
const applyingTemplate = ref<Template | null>(null)
const applyEstimateName = ref('')
const applyLoading = ref(false)
const applyError = ref<string | null>(null)
const applyInputRef = ref<HTMLInputElement | null>(null)

function openApplyModal(tpl: Template) {
  applyingTemplate.value = tpl
  applyEstimateName.value = ''
  applyError.value = null
  showApplyModal.value = true
  nextTick(() => applyInputRef.value?.focus())
}

async function handleApply() {
  const name = applyEstimateName.value.trim()
  if (!name || !applyingTemplate.value) return

  applyLoading.value = true
  applyError.value = null

  try {
    const estimate = await store.applyTemplate(applyingTemplate.value.id, name)
    showApplyModal.value = false
    // Refresh estimates list
    await estimatesStore.fetchEstimates()
    router.push(`/estimate/${estimate.id}`)
  } catch (e: any) {
    applyError.value = e?.data?.message || e?.message || 'Failed to create estimate from template.'
  } finally {
    applyLoading.value = false
  }
}

// -- Shared --

function goToTemplate(id: string | number) {
  router.push(`/templates/${id}`)
}

function confirmDelete(id: string | number) {
  if (confirm('Are you sure you want to delete this template?')) {
    store.deleteTemplate(id)
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function totalRows(tpl: Template): number {
  return tpl.data.reduce((sum, g) => sum + g.rows.length, 0)
}
</script>

<style scoped>
.template-card {
  cursor: default;
}

.template-card-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: var(--text-tertiary);
}

.template-stat-separator {
  color: var(--border-primary);
}

.template-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border-subtle);
  align-items: center;
}

.template-card-actions .btn-danger-ghost {
  margin-left: auto;
}

.btn-sm {
  padding: 5px 12px;
  font-size: 0.8rem;
  border-radius: 6px;
}

.btn-accent {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  border: none;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s, box-shadow 0.2s;
}

.btn-accent:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
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
