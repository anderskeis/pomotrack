<template>
  <div class="timer-display" :class="[sessionTypeClass, urgencyClass]">
    <div class="session-indicator">
      <span class="session-icon">{{ sessionIcon }}</span>
      <span class="session-label">{{ sessionLabel }}</span>
    </div>
    <div class="time">{{ formattedTime }}</div>
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
}>()

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
}

.session-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
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

.time {
  font-size: 7.2rem;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  letter-spacing: 0.05em;
  color: var(--text-primary);
  line-height: 1;
}

.session-info {
  margin-top: 1rem;
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

@media (max-width: 640px) {
  .time {
    font-size: 4.8rem;
  }

  .current-label {
    font-size: 1rem;
  }
}
</style>
