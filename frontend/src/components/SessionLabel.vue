<template>
  <div class="session-label-input">
    <label for="session-label" class="input-label">Session Label</label>
    <input
      id="session-label"
      type="text"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      placeholder="What are you working on?"
      class="input"
      maxlength="50"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped>
.session-label-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.input-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
</style>
