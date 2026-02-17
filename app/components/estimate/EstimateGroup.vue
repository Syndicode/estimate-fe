<template>
  <tbody>
    <!-- Group Header -->
    <tr class="row-group-header">
      <td class="cell-actions">
        <button
          class="btn btn-icon btn-icon-sm btn-danger-ghost row-actions"
          title="Delete group"
          @click="$emit('removeGroup')"
        >
          ✕
        </button>
      </td>
      <td class="cell-feature cell-editable" @dblclick="startEditName">
        <template v-if="isEditingName">
          <input
            ref="nameInputRef"
            type="text"
            :value="group.name"
            @input="onNameInput"
            @blur="isEditingName = false"
            @keydown.enter="isEditingName = false"
            @keydown.escape="isEditingName = false"
          />
        </template>
        <template v-else>
          <strong>{{ group.name || 'Unnamed Group' }}</strong>
        </template>
      </td>
      <td class="cell-assumptions"><!-- group assumptions --></td>
      <td class="cell-number">{{ fmt(totals.designMin) }}</td>
      <td class="cell-number">{{ fmt(totals.designMost) }}</td>
      <td class="cell-number">{{ fmt(totals.designMax) }}</td>
      <td class="cell-number">{{ fmt(totals.beMin) }}</td>
      <td class="cell-number">{{ fmt(totals.beMost) }}</td>
      <td class="cell-number">{{ fmt(totals.beMax) }}</td>
      <td class="cell-number">{{ fmt(totals.feMin) }}</td>
      <td class="cell-number">{{ fmt(totals.feMost) }}</td>
      <td class="cell-number">{{ fmt(totals.feMax) }}</td>
    </tr>

    <!-- Feature Rows -->
    <EstimateRowComponent
      v-for="row in group.rows"
      :key="row.id"
      :row="row"
      @update="(field, value) => handleUpdateRow(row.id, field, value)"
      @remove="handleRemoveRow(row.id)"
    />

    <!-- Add Row Button -->
    <tr class="add-group-row">
      <td colspan="12">
        <button class="add-row-btn" @click="handleAddRow">
          ＋ Add feature
        </button>
      </td>
    </tr>
  </tbody>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, inject } from 'vue'
import { groupTotals, type EstimateGroup } from '~/stores/estimates'
import type { TableHandler } from '~/composables/useTableHandler'
import EstimateRowComponent from './EstimateRow.vue'

const props = defineProps<{
  group: EstimateGroup
  estimateId: string | number
}>()

const emit = defineEmits<{
  removeGroup: []
}>()

const fallbackStore = useEstimatesStore()
const handler = inject<TableHandler>('tableHandler', {
  addGroup: (id, name) => fallbackStore.addGroup(id, name),
  removeGroup: (id, gid) => fallbackStore.removeGroup(id, gid),
  updateGroupName: (id, gid, name) => fallbackStore.updateGroupName(id, gid, name),
  addRow: (id, gid) => fallbackStore.addRow(id, gid),
  removeRow: (id, gid, rid) => fallbackStore.removeRow(id, gid, rid),
  updateRow: (id, gid, rid, data) => fallbackStore.updateRow(id, gid, rid, data),
})

const isEditingName = ref(false)
const nameInputRef = ref<HTMLInputElement | null>(null)

const totals = computed(() => groupTotals(props.group))

function fmt(n: number): string {
  return n === 0 ? '' : String(n)
}

async function startEditName() {
  isEditingName.value = true
  await nextTick()
  nameInputRef.value?.focus()
  nameInputRef.value?.select()
}

function onNameInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  handler.updateGroupName(props.estimateId, props.group.id, val)
}

function handleAddRow() {
  handler.addRow(props.estimateId, props.group.id)
}

function handleRemoveRow(rowId: string | number) {
  handler.removeRow(props.estimateId, props.group.id, rowId)
}

function handleUpdateRow(rowId: string | number, field: string, value: string | number) {
  handler.updateRow(props.estimateId, props.group.id, rowId, { [field]: value })
}
</script>

