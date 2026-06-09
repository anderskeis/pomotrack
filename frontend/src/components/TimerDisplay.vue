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
</script>

<style scoped>
.timer-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
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
  margin-bottom: 0.5rem;
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
  width: 280px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1.5rem 0;
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
  font-size: 5rem;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  letter-spacing: 0.02em;
  color: var(--text-primary);
  line-height: 1;
}

.session-info {
  margin-top: 0.5rem;
  min-height: 1.5rem;
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
  width: 200px;
  height: 200px;
  margin: 0.5rem 0;
}

.compact-mode .time {
  font-size: 3.5rem;
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
