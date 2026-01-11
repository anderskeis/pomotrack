<template>
  <div class="timer-display" :class="sessionTypeClass">
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
import type { SessionType } from '../composables'

const props = defineProps<{
  formattedTime: string
  sessionType: SessionType
  currentLabel?: string
}>()

const sessionTypeClass = computed(() => `session-${props.sessionType}`)

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
  font-size: 6rem;
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
  font-size: 0.875rem;
  color: var(--text-muted);
  background: var(--bg-subtle);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
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

@media (max-width: 640px) {
  .time {
    font-size: 4rem;
  }
}
</style>
