<template>
  <div class="timer-controls">
    <button 
      v-if="!isRunning" 
      @click="$emit('start')" 
      class="btn btn-primary btn-large"
    >
      <span class="btn-icon">▶</span>
      Start
    </button>
    <button 
      v-else 
      @click="$emit('pause')" 
      class="btn btn-secondary btn-large"
    >
      <span class="btn-icon">⏸</span>
      Pause
    </button>
    
    <div class="secondary-controls">
      <button @click="$emit('skip')" class="btn btn-ghost" title="Skip to next session">
        <span class="btn-icon">⏭</span>
        Skip
      </button>
      <button @click="$emit('reset')" class="btn btn-ghost" title="Reset timer">
        <span class="btn-icon">↺</span>
        Reset
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isRunning: boolean
}>()

defineEmits<{
  start: []
  pause: []
  skip: []
  reset: []
}>()
</script>

<style scoped>
.timer-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 1rem;
}

.btn-large {
  padding: 1rem 3rem;
  font-size: 1.25rem;
  min-width: 180px;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 12px var(--color-primary-shadow);
}

.btn-secondary {
  background: var(--color-secondary);
  color: white;
}

.btn-secondary:hover {
  background: var(--color-secondary-hover);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-ghost:hover {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.secondary-controls {
  display: flex;
  gap: 0.75rem;
}
</style>
