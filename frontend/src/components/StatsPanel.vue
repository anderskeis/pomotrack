<template>
  <div class="stats-panel">
    <h3 class="panel-title">Session Stats</h3>
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-icon">🍅</span>
        <div class="stat-content">
          <span class="stat-value">{{ completedPomodoros }}</span>
          <span class="stat-label">Pomodoros</span>
        </div>
      </div>
      <div class="stat-item">
        <span class="stat-icon">☕</span>
        <div class="stat-content">
          <span class="stat-value">{{ completedBreaks }}</span>
          <span class="stat-label">Breaks</span>
        </div>
      </div>
      <div class="stat-item">
        <span class="stat-icon">⏱</span>
        <div class="stat-content">
          <span class="stat-value">{{ focusTime }}</span>
          <span class="stat-label">Focus Time</span>
        </div>
      </div>
    </div>
    <p class="stats-note">Stats reset on page refresh</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  completedPomodoros: number
  completedBreaks: number
  focusDuration: number // minutes per pomodoro
}>()

const focusTime = computed(() => {
  const totalMinutes = props.completedPomodoros * props.focusDuration
  if (totalMinutes < 60) {
    return `${totalMinutes}m`
  }
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
})
</script>

<style scoped>
.stats-panel {
  padding: 1.25rem;
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.panel-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin: 0 0 1rem 0;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--bg-subtle);
  border-radius: 6px;
}

.stat-icon {
  font-size: 1.25rem;
  width: 2rem;
  text-align: center;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.stats-note {
  margin: 1rem 0 0 0;
  font-size: 0.7rem;
  color: var(--text-muted);
  text-align: center;
  font-style: italic;
}
</style>
