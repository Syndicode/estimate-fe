<template>
  <div>
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">📊 Dashboard</h1>
        <span class="page-subtitle">{{ estimates.length }} estimate{{ estimates.length !== 1 ? 's' : '' }}</span>
      </div>
      <div class="page-header-right">
        <NuxtLink v-if="authStore.isAuthenticated" to="/templates" class="btn btn-template">
          📝 From Template
        </NuxtLink>
        <button v-if="authStore.isAuthenticated" class="btn btn-ai" @click="showAiModal = true">
          ✨ AI Generate
        </button>
        <button class="btn btn-primary" @click="showModal = true">
          ＋ New Estimate
        </button>
      </div>
    </div>

    <div class="dashboard animate-fade-in">
      <!-- Empty state -->
      <div v-if="estimates.length === 0" class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h2 class="empty-state-title">No estimates yet</h2>
        <p class="empty-state-text">
          Create your first project estimate to get started. Add groups, features, and hours to build a comprehensive breakdown.
        </p>
        <div class="empty-state-actions">
          <button class="btn btn-primary" @click="showModal = true">
            ＋ Create First Estimate
          </button>
          <button v-if="authStore.isAuthenticated" class="btn btn-ai" @click="showAiModal = true">
            ✨ Generate with AI
          </button>
        </div>
      </div>

      <!-- Estimates grid -->
      <div v-else class="estimates-grid">
        <div
          v-for="est in estimates"
          :key="est.id"
          class="card estimate-card animate-slide-up"
          @click="goToEstimate(est.id)"
        >
          <div class="estimate-card-header">
            <div class="estimate-card-title">{{ est.name }}</div>
            <div class="estimate-card-date">{{ formatDate(est.updatedAt) }}</div>
          </div>

          <div class="estimate-card-stats">
            <div class="estimate-card-stat">
              <span class="estimate-card-stat-label">Design</span>
              <span class="estimate-card-stat-value stat-design">{{ totalHours(est, 'design') }}h</span>
            </div>
            <div class="estimate-card-stat">
              <span class="estimate-card-stat-label">Backend</span>
              <span class="estimate-card-stat-value stat-be">{{ totalHours(est, 'be') }}h</span>
            </div>
            <div class="estimate-card-stat">
              <span class="estimate-card-stat-label">Frontend</span>
              <span class="estimate-card-stat-value stat-fe">{{ totalHours(est, 'fe') }}h</span>
            </div>
          </div>

          <div class="estimate-card-footer">
            <span class="estimate-card-groups">
              {{ est.groups.length }} group{{ est.groups.length !== 1 ? 's' : '' }}
            </span>
            <button
              class="btn btn-icon btn-icon-sm btn-danger-ghost"
              title="Delete estimate"
              @click.stop="confirmDelete(est.id)"
            >
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h2 class="modal-title">Create New Estimate</h2>
        <input
          ref="modalInputRef"
          v-model="newName"
          class="modal-input"
          type="text"
          placeholder="e.g. Marketplace MVP, Landing Page Redesign…"
          @keydown.enter="handleCreate"
        />
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showModal = false">Cancel</button>
          <button class="btn btn-primary" :disabled="!newName.trim()" @click="handleCreate">
            Create
          </button>
        </div>
      </div>
    </div>

    <!-- AI Generate Modal -->
    <div v-if="showAiModal" class="modal-overlay" @click.self="!aiLoading && (showAiModal = false)">
      <div class="modal ai-modal">
        <div class="ai-modal-header">
          <h2 class="modal-title">✨ AI Auto-Fill</h2>
          <p class="ai-modal-subtitle">Describe your project and AI will generate a full estimate with groups, features, assumptions, and hour breakdowns.</p>
        </div>

        <div v-if="aiError" class="ai-error">
          {{ aiError }}
        </div>

        <div class="form-group">
          <label for="ai-name">Estimate Name <span class="optional">(optional)</span></label>
          <input
            id="ai-name"
            v-model="aiName"
            class="modal-input"
            type="text"
            placeholder="e.g. E-Commerce Platform MVP"
            :disabled="aiLoading"
          />
        </div>

        <div class="form-group">
          <label for="ai-description">Project Description</label>
          <textarea
            id="ai-description"
            ref="aiTextareaRef"
            v-model="aiDescription"
            class="ai-textarea"
            placeholder="Describe your project in detail... &#10;&#10;For example: A marketplace platform where vendors can list products, buyers can browse and purchase items, with a payment system, user reviews, admin dashboard, and mobile-responsive design."
            rows="6"
            maxlength="2000"
            :disabled="aiLoading"
          />
          <div class="ai-char-count" :class="{ warn: aiDescription.length > 1800 }">
            {{ aiDescription.length }} / 2000
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-ghost" :disabled="aiLoading" @click="showAiModal = false">Cancel</button>
          <button
            class="btn btn-ai"
            :disabled="!aiDescription.trim() || aiLoading"
            @click="handleAiGenerate"
          >
            <span v-if="aiLoading" class="ai-spinner" />
            {{ aiLoading ? 'Generating…' : '✨ Generate Estimate' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'
import { grandTotals, type Estimate } from '~/stores/estimates'

const store = useEstimatesStore()
const authStore = useAuthStore()
const router = useRouter()

// Init store: loads from API if authenticated, localStorage otherwise
onMounted(() => store.init())

const estimates = computed(() => store.estimatesList)

// --- Create modal ---
const showModal = ref(false)
const newName = ref('')
const modalInputRef = ref<HTMLInputElement | null>(null)

watch(showModal, async (val) => {
  if (val) {
    newName.value = ''
    await nextTick()
    modalInputRef.value?.focus()
  }
})

async function handleCreate() {
  const name = newName.value.trim()
  if (!name) return
  const est = await store.createEstimate(name)
  showModal.value = false
  router.push(`/estimate/${est.id}`)
}

// --- AI Generate modal ---
const showAiModal = ref(false)
const aiName = ref('')
const aiDescription = ref('')
const aiLoading = ref(false)
const aiError = ref<string | null>(null)
const aiTextareaRef = ref<HTMLTextAreaElement | null>(null)

watch(showAiModal, async (val) => {
  if (val) {
    aiName.value = ''
    aiDescription.value = ''
    aiError.value = null
    await nextTick()
    aiTextareaRef.value?.focus()
  }
})

async function handleAiGenerate() {
  const description = aiDescription.value.trim()
  if (!description) return

  aiLoading.value = true
  aiError.value = null

  try {
    const { apiFetch } = useApi()
    const data = await apiFetch<any>('/ai/generate', {
      method: 'POST',
      body: {
        description,
        name: aiName.value.trim() || undefined,
      },
    })

    // Refresh estimates list from API
    await store.fetchEstimates()

    showAiModal.value = false

    // Navigate to the new estimate
    if (data?.id) {
      router.push(`/estimate/${data.id}`)
    }
  } catch (e: any) {
    aiError.value = e?.data?.message || e?.data?.error || e?.message || 'Failed to generate estimate. Please try again.'
  } finally {
    aiLoading.value = false
  }
}

// --- Shared ---
function goToEstimate(id: string | number) {
  router.push(`/estimate/${id}`)
}

function confirmDelete(id: string | number) {
  if (confirm('Are you sure you want to delete this estimate?')) {
    store.deleteEstimate(id)
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function totalHours(est: Estimate, discipline: 'design' | 'be' | 'fe'): number {
  const totals = grandTotals(est.groups)
  const field = `${discipline}Most` as keyof typeof totals
  return totals[field] || 0
}
</script>

<style scoped>
.btn-template {
  padding: 8px 18px;
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.2s, transform 0.1s, box-shadow 0.2s;
}

.btn-template:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(20, 184, 166, 0.4);
  color: white;
}

.btn-ai {
  padding: 8px 18px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1, #4f46e5);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}

.btn-ai::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
  opacity: 0;
  transition: opacity 0.2s;
}

.btn-ai:hover:not(:disabled)::before {
  opacity: 1;
}

.btn-ai:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
}

.btn-ai:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-state-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.ai-modal {
  max-width: 560px;
}

.ai-modal-header {
  margin-bottom: 1.25rem;
}

.ai-modal-subtitle {
  color: var(--text-tertiary);
  font-size: 0.875rem;
  margin-top: 0.5rem;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.4rem;
}

.form-group .optional {
  color: var(--text-tertiary);
  font-weight: 400;
}

.ai-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.ai-textarea:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
}

.ai-textarea::placeholder {
  color: var(--text-tertiary);
}

.ai-textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-char-count {
  text-align: right;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: 0.3rem;
}

.ai-char-count.warn {
  color: #f59e0b;
}

.ai-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.ai-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 6px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

