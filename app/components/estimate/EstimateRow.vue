<template>
  <tr class="row-feature animate-slide-up">
    <td class="cell-actions">
      <button
        class="btn btn-icon btn-icon-sm btn-danger-ghost row-actions"
        title="Delete row"
        @click="$emit('remove')"
      >
        ✕
      </button>
    </td>
    <EditableCell
      :model-value="row.feature"
      type="feature"
      @update:model-value="update('feature', $event)"
    />
    <EditableCell
      :model-value="row.assumptions"
      type="assumptions"
      @update:model-value="update('assumptions', $event)"
    />
    <EditableCell
      :model-value="row.designMin"
      type="number"
      @update:model-value="update('designMin', $event)"
    />
    <EditableCell
      :model-value="row.designMost"
      type="number"
      @update:model-value="update('designMost', $event)"
    />
    <EditableCell
      :model-value="row.designMax"
      type="number"
      @update:model-value="update('designMax', $event)"
    />
    <EditableCell
      :model-value="row.beMin"
      type="number"
      @update:model-value="update('beMin', $event)"
    />
    <EditableCell
      :model-value="row.beMost"
      type="number"
      @update:model-value="update('beMost', $event)"
    />
    <EditableCell
      :model-value="row.beMax"
      type="number"
      @update:model-value="update('beMax', $event)"
    />
    <EditableCell
      :model-value="row.feMin"
      type="number"
      @update:model-value="update('feMin', $event)"
    />
    <EditableCell
      :model-value="row.feMost"
      type="number"
      @update:model-value="update('feMost', $event)"
    />
    <EditableCell
      :model-value="row.feMax"
      type="number"
      @update:model-value="update('feMax', $event)"
    />
  </tr>
</template>

<script setup lang="ts">
import type { EstimateRow } from '~/stores/estimates'

const props = defineProps<{
  row: EstimateRow
}>()

const emit = defineEmits<{
  update: [field: string, value: string | number]
  remove: []
}>()

function update(field: string, value: string | number) {
  emit('update', field, value)
}
</script>
