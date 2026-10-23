<template>
  <div class="session-label-input themed-panel">
    <label for="session-label" class="input-label">{{ labels?.title ?? 'Session Label' }}</label>
    <input
      id="session-label"
      type="text"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :placeholder="labels?.placeholder ?? 'What are you working on?'"
      class="input"
      maxlength="50"
      list="label-presets"
    />
    <datalist id="label-presets">
      <option v-for="preset in allPresets" :key="preset" :value="preset" />
    </datalist>
    <div v-if="activePresets.length > 0" class="quick-labels">
      <button
        v-for="preset in activePresets.slice(0, 4)"
        :key="preset"
        class="quick-label"
        :class="{ active: modelValue === preset }"
        @click="$emit('update:modelValue', preset)"
      >
        {{ preset }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ThemeLabels } from '../composables'

const props = defineProps<{
  modelValue: string
  recentLabels?: string[]
  labels?: ThemeLabels['sessionLabel']
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const fallbackPresets = ['Deep Work', 'Meetings', 'Learning', 'Admin', 'Creative']

const activePresets = computed(() => props.labels?.presets ?? fallbackPresets)

const allPresets = computed(() => {
  const recent = props.recentLabels || []
  const combined = [...new Set([...recent, ...activePresets.value])]
  return combined.slice(0, 10)
})
</script>

<style scoped>
.session-label-input {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.75rem;
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.input-label {
  font-size: 0.75rem;
  font-weight: 700;
  font-family: var(--font-heading, inherit);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.input {
  padding: 0.75rem;
  font-size: 0.875rem;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  transition: border-color 0.15s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.input::placeholder {
  color: var(--text-muted);
}

.quick-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.25rem;
}

.quick-label {
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.quick-label:hover {
  background: var(--bg-input);
  color: var(--text-primary);
}

.quick-label.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}
</style>
