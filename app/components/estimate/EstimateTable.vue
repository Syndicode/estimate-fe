<template>
  <div class="estimate-table-wrapper">
    <table class="estimate-table">
      <thead>
        <!-- Row 1: Discipline groups -->
        <tr>
          <th class="col-actions" rowspan="2"></th>
          <th class="col-feature" rowspan="2">Functional Decomposition</th>
          <th class="col-assumptions" rowspan="2">Assumptions</th>
          <th class="th-group th-group-design" colspan="3">Design</th>
          <th class="th-group th-group-be" colspan="3">BE</th>
          <th class="th-group th-group-fe" colspan="3">FE</th>
        </tr>
        <!-- Row 2: min / most likely / max -->
        <tr>
          <th class="col-number">min</th>
          <th class="col-number">most likely</th>
          <th class="col-number">max</th>
          <th class="col-number">min</th>
          <th class="col-number">most likely</th>
          <th class="col-number">max</th>
          <th class="col-number">min</th>
          <th class="col-number">most likely</th>
          <th class="col-number">max</th>
        </tr>
      </thead>

      <!-- Grand Total -->
      <tbody>
        <tr class="row-grand-total">
          <td class="cell-actions"></td>
          <td class="cell-feature"><strong>Grand Total</strong></td>
          <td class="cell-assumptions"></td>
          <td class="cell-number">{{ fmt(grand.designMin) }}</td>
          <td class="cell-number">{{ fmt(grand.designMost) }}</td>
          <td class="cell-number">{{ fmt(grand.designMax) }}</td>
          <td class="cell-number">{{ fmt(grand.beMin) }}</td>
          <td class="cell-number">{{ fmt(grand.beMost) }}</td>
          <td class="cell-number">{{ fmt(grand.beMax) }}</td>
          <td class="cell-number">{{ fmt(grand.feMin) }}</td>
          <td class="cell-number">{{ fmt(grand.feMost) }}</td>
          <td class="cell-number">{{ fmt(grand.feMax) }}</td>
        </tr>
      </tbody>

      <!-- Groups -->
      <EstimateGroup
        v-for="group in estimate.groups"
        :key="group.id"
        :group="group"
        :estimate-id="estimate.id"
        @remove-group="handleRemoveGroup(group.id)"
      />

      <!-- Add Group -->
      <tbody>
        <tr class="add-group-row">
          <td colspan="12">
            <button class="add-row-btn" style="font-weight: 600;" @click="handleAddGroup">
              ＋ Add group
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, provide } from 'vue'
import { grandTotals, type Estimate } from '~/stores/estimates'
import type { TableHandler } from '~/composables/useTableHandler'

const props = defineProps<{
  estimate: Estimate
}>()

const fallbackStore = useEstimatesStore()
const handler = inject<TableHandler>('tableHandler', {
  addGroup: (id: string | number, name?: string) => fallbackStore.addGroup(id, name),
  removeGroup: (id: string | number, gid: string | number) => fallbackStore.removeGroup(id, gid),
  updateGroupName: (id: string | number, gid: string | number, name: string) => fallbackStore.updateGroupName(id, gid, name),
  addRow: (id: string | number, gid: string | number) => fallbackStore.addRow(id, gid),
  removeRow: (id: string | number, gid: string | number, rid: string | number) => fallbackStore.removeRow(id, gid, rid),
  updateRow: (id: string | number, gid: string | number, rid: string | number, data: Record<string, any>) => fallbackStore.updateRow(id, gid, rid, data),
})

// Provide handler down to EstimateGroup components
provide('tableHandler', handler)

const grand = computed(() => grandTotals(props.estimate.groups))

function fmt(n: number): string {
  return n === 0 ? '' : String(n)
}

function handleAddGroup() {
  handler.addGroup(props.estimate.id)
}

function handleRemoveGroup(groupId: string | number) {
  handler.removeGroup(props.estimate.id, groupId)
}
</script>
