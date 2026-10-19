<template>
  <div class="timer-display" :class="[sessionTypeClass, urgencyClass]">
    <div class="session-indicator">
      <span class="session-icon">{{ sessionIcon }}</span>
      <span class="session-label">{{ sessionLabel }}</span>
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
      <span v-if="currentLabel" class="current-label">{{ currentLabel }}</span>
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

const sessionIcon = computed(() => {
  switch (props.sessionType) {
    case 'focus': return '🍅'
    case 'short-break': return '☕'
    case 'long-break': return '🌴'
  }
})

const sessionLabel = computed(() => {
  switch (props.sessionType) {
    case 'focus': return 'Focus'
    case 'short-break': return 'Short Break'
    case 'long-break': return 'Long Break'
  }
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
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  width: 100%;
  max-width: 450px;
}

.session-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  font-size: 1.25rem;
  color: var(--text-secondary);
}

.session-icon {
  font-size: 1.5rem;
}

.session-label {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
}

.timer-circle-container {
  position: relative;
  width: 240px;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0.75rem 0;
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
  gap: 0.5rem;
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
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--color-primary);
  padding: 0.5rem 1.25rem;
  border-radius: 999px;
  box-shadow: 0 2px 8px var(--color-primary-shadow);
}

/* Session type variants */
.session-focus .session-indicator {
  color: var(--color-focus);
}

.session-short-break .session-indicator {
  color: var(--color-short-break);
}

.session-long-break .session-indicator {
  color: var(--color-long-break);
}

/* Urgency states - only during focus */
.urgency-warning .time {
  color: var(--color-urgency-warning, #f59e0b);
}

.urgency-warning {
  animation: pulse-warning 2s ease-in-out infinite;
}

.urgency-critical .time {
  color: var(--color-urgency-critical, #ef4444);
}

.urgency-critical {
  animation: pulse-critical 1s ease-in-out infinite;
}

@keyframes pulse-warning {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
  }
  50% {
    box-shadow: 0 0 20px 4px rgba(245, 158, 11, 0.3);
  }
}

@keyframes pulse-critical {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
    border-color: var(--border-color);
  }
  50% {
    box-shadow: 0 0 25px 6px rgba(239, 68, 68, 0.4);
    border-color: var(--color-urgency-critical, #ef4444);
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

.compact-mode .session-indicator {
  font-size: 1rem;
}

.compact-mode .session-icon {
  font-size: 1.15rem;
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

  .current-label {
    font-size: 1rem;
  }
}
</style>
