<template>
  <div class="stats-panel">
    <h3 class="panel-title">Daily Progress</h3>
    
    <!-- Daily Goal Progress -->
    <div class="goal-progress">
      <div class="goal-header">
        <span class="goal-text">{{ completedPomodoros }}/{{ dailyGoal }} 🍅</span>
        <span class="goal-percent">{{ goalPercent }}%</span>
      </div>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${Math.min(goalPercent, 100)}%` }"
          :class="{ complete: goalPercent >= 100 }"
        ></div>
      </div>
      <p v-if="goalPercent >= 100" class="goal-complete">🎉 Daily goal reached!</p>
    </div>

    <div class="settings-divider"></div>

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

    <button v-if="hasHistory" class="btn btn-summary" @click="$emit('showSummary')">
      View Summary
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  completedPomodoros: number
  completedBreaks: number
  focusDuration: number // minutes per pomodoro
  dailyGoal: number
  hasHistory: boolean
}>()

defineEmits<{
  showSummary: []
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

const goalPercent = computed(() => {
  if (props.dailyGoal <= 0) return 0
  return Math.round((props.completedPomodoros / props.dailyGoal) * 100)
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

.settings-divider {
  height: 1px;
  background: var(--border-color);
  margin: 1rem 0;
}

.goal-progress {
  margin-bottom: 0.5rem;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.goal-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.goal-percent {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.progress-bar {
  height: 8px;
  background: var(--bg-subtle);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.complete {
  background: var(--color-short-break);
}

.goal-complete {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: var(--color-short-break);
  text-align: center;
  font-weight: 600;
}

.btn-summary {
  width: 100%;
  margin-top: 1rem;
  padding: 0.5rem;
  font-size: 0.75rem;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-summary:hover {
  background: var(--bg-input);
  color: var(--text-primary);
}
</style>
