<template>
  <td
    :class="[
      'cell-editable',
      type === 'number' ? 'cell-number' : '',
      type === 'feature' ? 'cell-feature' : '',
      type === 'assumptions' ? 'cell-assumptions' : '',
      isEditing ? 'editing' : '',
    ]"
    @dblclick="startEdit"
  >
    <template v-if="isEditing">
      <input
        ref="inputRef"
        :type="type === 'number' ? 'number' : 'text'"
        :value="modelValue"
        @input="onInput"
        @blur="stopEdit"
        @keydown.enter="stopEdit"
        @keydown.escape="cancelEdit"
        @keydown.tab="stopEdit"
      />
    </template>
    <template v-else>
      <span v-if="type === 'number'">{{ displayValue }}</span>
      <span v-else>{{ modelValue || '—' }}</span>
    </template>
  </td>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'

const props = defineProps<{
  modelValue: string | number
  type?: 'text' | 'number' | 'feature' | 'assumptions'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const isEditing = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const originalValue = ref<string | number>('')

const displayValue = computed(() => {
  if (props.type === 'number') {
    const val = Number(props.modelValue)
    return val === 0 ? '' : val
  }
  return props.modelValue
})

async function startEdit() {
  originalValue.value = props.modelValue
  isEditing.value = true
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
}

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
  if (props.type === 'number') {
    emit('update:modelValue', Number(target.value) || 0)
  } else {
    emit('update:modelValue', target.value)
  }
}

function stopEdit() {
  isEditing.value = false
}

function cancelEdit() {
  emit('update:modelValue', originalValue.value)
  isEditing.value = false
}
</script>
