<template>
  <div class="stats-panel themed-panel">
    <h3 class="panel-title">{{ labels?.dailyProgressTitle ?? 'Daily Progress' }}</h3>
    
    <!-- Daily Goal Progress -->
    <div class="goal-progress">
      <div class="goal-header">
        <span class="goal-text">
          {{ completedPomodoros }}/{{ dailyGoal }}
          <ThemeIcon :themeId="themeId || 'default'" slot="focus" :fallback="themeIcons?.focus" />
        </span>
        <span class="goal-percent">{{ goalPercent }}%</span>
      </div>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${Math.min(goalPercent, 100)}%` }"
          :class="{ complete: goalPercent >= 100 }"
        ></div>
      </div>
      <p v-if="goalPercent >= 100" class="goal-complete">
        {{ labels?.goalReachedText ?? '🎉 Daily goal reached!' }}
      </p>
    </div>

    <div class="settings-divider"></div>

    <h3 class="panel-title">{{ labels?.sessionStatsTitle ?? 'Session Stats' }}</h3>
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-icon">
          <ThemeIcon :themeId="themeId || 'default'" slot="focus" :fallback="themeIcons?.focus" />
        </span>
        <div class="stat-content">
          <span class="stat-value">{{ completedPomodoros }}</span>
          <span class="stat-label">{{ labels?.pomodorosLabel ?? 'Pomodoros' }}</span>
        </div>
      </div>
      <div class="stat-item">
        <span class="stat-icon">
          <ThemeIcon :themeId="themeId || 'default'" slot="shortBreak" :fallback="themeIcons?.shortBreak" />
        </span>
        <div class="stat-content">
          <span class="stat-value">{{ completedBreaks }}</span>
          <span class="stat-label">{{ labels?.breaksLabel ?? 'Breaks' }}</span>
        </div>
      </div>
      <div class="stat-item">
        <span class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 1.15em; height: 1.15em; display: inline-block; vertical-align: middle;">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9V13L14.5 14.5M9 2H15" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <div class="stat-content">
          <span class="stat-value">{{ focusTime }}</span>
          <span class="stat-label">{{ labels?.focusTimeLabel ?? 'Focus Time' }}</span>
        </div>
      </div>
    </div>

    <button v-if="hasHistory" class="btn btn-summary" @click="$emit('showSummary')">
      {{ labels?.viewSummaryBtn ?? 'View Summary' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ThemeIcons, ThemeLabels } from '../composables'
import ThemeIcon from './ThemeIcon.vue'

const props = defineProps<{
  completedPomodoros: number
  completedBreaks: number
  focusDuration: number // minutes per pomodoro
  dailyGoal: number
  hasHistory: boolean
  themeId?: string
  themeIcons?: ThemeIcons
  labels?: ThemeLabels['stats']
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
  padding: 1rem;
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
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.375rem;
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
  font-size: 1.1rem;
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
  margin: 0.625rem 0;
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

/* Compact mode */
.compact-mode .stats-panel {
  padding: 0.75rem;
}

.compact-mode .stat-item {
  padding: 0.25rem;
}

.compact-mode .settings-divider {
  margin: 0.375rem 0;
}

.compact-mode .btn-summary {
  margin-top: 0.5rem;
}
</style>
