<template>
  <div class="timer-display" :class="[sessionTypeClass, urgencyClass]">
    <div class="session-switcher" role="tablist" aria-label="Timer session mode">
      <button
        v-for="mode in sessionModes"
        :key="mode.type"
        type="button"
        role="tab"
        class="session-tab"
        :class="[
          `tab-${mode.type}`,
          { active: sessionType === mode.type },
        ]"
        :aria-selected="sessionType === mode.type"
        @click="handleSelectMode(mode.type)"
      >
        <span class="session-icon" aria-hidden="true">{{ mode.icon }}</span>
        <span class="session-label">{{ mode.label }}</span>
      </button>
    </div>
    <div class="timer-circle-container">
      <svg class="progress-ring" viewBox="0 0 280 280">
        <circle
          class="progress-ring__background"
          stroke="var(--bg-subtle)"
          stroke-width="10"
          fill="transparent"
          r="120"
          cx="140"
          cy="140"
        />
        <circle
          class="progress-ring__progress"
          stroke-width="10"
          stroke-linecap="round"
          fill="transparent"
          r="120"
          cx="140"
          cy="140"
          :stroke-dasharray="strokeDasharray"
          :stroke-dashoffset="strokeDashoffset"
          transform="rotate(-90 140 140)"
        />
      </svg>
      <div class="time">{{ formattedTime }}</div>
    </div>
    <div class="session-info">
      <div class="cycle-dots" role="img" :aria-label="cycleAriaLabel">
        <span
          v-for="(filled, i) in cycleDots"
          :key="i"
          class="cycle-dot"
          :class="{ 'is-filled': filled, 'is-active': i === activeDotIndex }"
        ></span>
      </div>
      <span v-if="currentLabel" class="current-label" :title="currentLabel">
        🎯 {{ currentLabel }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SessionType, UrgencyLevel } from '../composables'

const props = defineProps<{
  formattedTime: string
  sessionType: SessionType
  currentLabel?: string
  urgencyLevel?: UrgencyLevel
  isRunning?: boolean
  progress?: number
  completedPomodoros?: number
  pomodorosUntilLongBreak?: number
}>()

const emit = defineEmits<{
  selectMode: [type: SessionType]
}>()

const sessionModes: { type: SessionType; label: string; icon: string }[] = [
  { type: 'focus', label: 'Focus', icon: '🍅' },
  { type: 'short-break', label: 'Short Break', icon: '☕' },
  { type: 'long-break', label: 'Long Break', icon: '🌴' },
]

const handleSelectMode = (type: SessionType) => {
  if (type !== props.sessionType) {
    emit('selectMode', type)
  }
}

const radius = 120
const strokeDasharray = 2 * Math.PI * radius

const strokeDashoffset = computed(() => {
  const p = props.progress ?? 0
  return strokeDasharray - (p / 100) * strokeDasharray
})

const sessionTypeClass = computed(() => `session-${props.sessionType}`)

const urgencyClass = computed(() => {
  if (!props.isRunning || props.sessionType !== 'focus') return ''
  return props.urgencyLevel ? `urgency-${props.urgencyLevel}` : ''
})

// Pomodoro cycle dots — progress toward the long break
const cycleLength = computed(() => Math.max(1, props.pomodorosUntilLongBreak ?? 4))

// Pomodoros completed within the current cycle (resets after each long break)
const completedInCycle = computed(() => (props.completedPomodoros ?? 0) % cycleLength.value)

const cycleDots = computed(() => {
  // During a long break the whole cycle is complete
  const fillAll = props.sessionType === 'long-break'
  return Array.from({ length: cycleLength.value }, (_, i) => fillAll || i < completedInCycle.value)
})

// Index of the pomodoro currently in progress (only during focus sessions)
const activeDotIndex = computed(() => {
  if (props.sessionType !== 'focus') return -1
  return completedInCycle.value
})

const cycleAriaLabel = computed(() => {
  if (props.sessionType === 'long-break') return 'Long break in progress'
  const remaining = cycleLength.value - completedInCycle.value
  const noun = remaining === 1 ? 'pomodoro' : 'pomodoros'
  return `${completedInCycle.value} of ${cycleLength.value} pomodoros completed this cycle, ${remaining} ${noun} until long break`
})
</script>

<style scoped>
.timer-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 450px;
}

.session-switcher {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  margin-bottom: 0.5rem;
}

.session-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4rem 0.875rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
  white-space: nowrap;
}

.session-tab:hover:not(.active) {
  color: var(--text-primary);
  background: var(--bg-subtle);
}

.session-tab.active.tab-focus {
  background: var(--color-focus);
  color: #ffffff;
  box-shadow: 0 2px 8px var(--color-primary-shadow);
}

.session-tab.active.tab-short-break {
  background: var(--color-short-break);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.25);
}

.session-tab.active.tab-long-break {
  background: var(--color-long-break);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

.session-icon {
  font-size: 1rem;
  line-height: 1;
}

.session-label {
  letter-spacing: 0.02em;
}

.timer-circle-container {
  position: relative;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0.5rem 0;
}

.progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.progress-ring__progress {
  transition: stroke-dashoffset 0.35s ease, stroke 0.3s ease;
}

/* Default progress ring stroke colors */
.session-focus .progress-ring__progress {
  stroke: var(--color-focus);
}

.session-short-break .progress-ring__progress {
  stroke: var(--color-short-break);
}

.session-long-break .progress-ring__progress {
  stroke: var(--color-long-break);
}

.time {
  position: relative;
  z-index: 1;
  font-size: 4rem;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  letter-spacing: 0.02em;
  color: var(--text-primary);
  line-height: 1;
}

.session-info {
  margin-top: 0.25rem;
  min-height: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
}

/* Pomodoro cycle dots */
.cycle-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.cycle-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  transition:
    background 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.cycle-dot.is-filled {
  background: var(--color-focus);
  border-color: var(--color-focus);
}

/* The pomodoro currently in progress */
.cycle-dot.is-active {
  border-color: var(--color-focus);
  box-shadow: 0 0 0 2px var(--color-primary-shadow);
}

.current-label {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  padding: 0.375rem 1rem;
  border-radius: 999px;
}

/* Urgency states - only during focus */
.urgency-warning .time {
  color: var(--color-urgency-warning, #f59e0b);
}

.urgency-warning .timer-circle-container {
  animation: pulse-warning 2s ease-in-out infinite;
}

.urgency-critical .time {
  color: var(--color-urgency-critical, #ef4444);
}

.urgency-critical .timer-circle-container {
  animation: pulse-critical 1s ease-in-out infinite;
}

@keyframes pulse-warning {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
  }
  50% {
    box-shadow: 0 0 24px 4px rgba(245, 158, 11, 0.3);
  }
}

@keyframes pulse-critical {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
  50% {
    box-shadow: 0 0 28px 6px rgba(239, 68, 68, 0.4);
  }
}

/* Compact mode support */
.compact-mode .timer-circle-container {
  width: 180px;
  height: 180px;
  margin: 0.25rem 0;
}

.compact-mode .time {
  font-size: 2.75rem;
}

.compact-mode .session-tab {
  padding: 0.3rem 0.65rem;
  font-size: 0.75rem;
}

.compact-mode .session-icon {
  font-size: 0.875rem;
}

.compact-mode .cycle-dot {
  width: 0.375rem;
  height: 0.375rem;
}

@media (max-width: 640px) {
  .timer-circle-container {
    width: 220px;
    height: 220px;
  }

  .time {
    font-size: 3.8rem;
  }

  .session-tab {
    padding: 0.35rem 0.65rem;
    font-size: 0.75rem;
  }

  .current-label {
    font-size: 0.875rem;
    max-width: 260px;
  }
}
</style>
