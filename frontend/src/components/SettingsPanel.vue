<template>
  <div class="settings-panel">
    <h3 class="panel-title">Timer Settings</h3>
    
    <div class="settings-group">
      <div class="setting-item">
        <label for="focus-duration" class="setting-label">Focus Duration</label>
        <div class="setting-control">
          <input
            id="focus-duration"
            type="number"
            :value="config.focusDuration"
            @change="updateConfig('focusDuration', ($event.target as HTMLInputElement).valueAsNumber)"
            min="1"
            max="120"
            class="input input-number"
          />
          <span class="setting-unit">min</span>
        </div>
      </div>

      <div class="setting-item">
        <label for="short-break" class="setting-label">Short Break</label>
        <div class="setting-control">
          <input
            id="short-break"
            type="number"
            :value="config.shortBreakDuration"
            @change="updateConfig('shortBreakDuration', ($event.target as HTMLInputElement).valueAsNumber)"
            min="1"
            max="30"
            class="input input-number"
          />
          <span class="setting-unit">min</span>
        </div>
      </div>

      <div class="setting-item">
        <label for="long-break" class="setting-label">Long Break</label>
        <div class="setting-control">
          <input
            id="long-break"
            type="number"
            :value="config.longBreakDuration"
            @change="updateConfig('longBreakDuration', ($event.target as HTMLInputElement).valueAsNumber)"
            min="1"
            max="60"
            class="input input-number"
          />
          <span class="setting-unit">min</span>
        </div>
      </div>

      <div class="setting-item">
        <label for="long-break-interval" class="setting-label">Long Break After</label>
        <div class="setting-control">
          <input
            id="long-break-interval"
            type="number"
            :value="config.pomodorosUntilLongBreak"
            @change="updateConfig('pomodorosUntilLongBreak', ($event.target as HTMLInputElement).valueAsNumber)"
            min="1"
            max="10"
            class="input input-number"
          />
          <span class="setting-unit">🍅</span>
        </div>
      </div>

      <div class="setting-item">
        <label for="daily-goal" class="setting-label">Daily Goal</label>
        <div class="setting-control">
          <input
            id="daily-goal"
            type="number"
            :value="config.dailyGoal"
            @change="updateConfig('dailyGoal', ($event.target as HTMLInputElement).valueAsNumber)"
            min="1"
            max="20"
            class="input input-number"
          />
          <span class="setting-unit">🍅</span>
        </div>
      </div>
    </div>

    <div class="settings-divider"></div>

    <h3 class="panel-title">Auto-Start</h3>
    <div class="settings-group">
      <div class="setting-item setting-row">
        <label class="setting-label">Auto-start breaks</label>
        <button 
          @click="updateConfigBool('autoStartBreaks', !config.autoStartBreaks)"
          class="btn btn-toggle"
          :class="{ active: config.autoStartBreaks }"
        >
          {{ config.autoStartBreaks ? '✓ On' : '✗ Off' }}
        </button>
      </div>

      <div class="setting-item setting-row">
        <label class="setting-label">Auto-start focus</label>
        <button 
          @click="updateConfigBool('autoStartFocus', !config.autoStartFocus)"
          class="btn btn-toggle"
          :class="{ active: config.autoStartFocus }"
        >
          {{ config.autoStartFocus ? '✓ On' : '✗ Off' }}
        </button>
      </div>
    </div>

    <div class="settings-divider"></div>

    <h3 class="panel-title">Alerts & Display</h3>
    <div class="settings-group">
      <div class="setting-item setting-row">
        <label class="setting-label">Sound</label>
        <button 
          @click="$emit('toggleSound')" 
          class="btn btn-toggle"
          :class="{ active: soundEnabled }"
        >
          {{ soundEnabled ? '🔔 On' : '🔕 Off' }}
        </button>
      </div>

      <div class="setting-item setting-row">
        <label class="setting-label">Notifications</label>
        <button 
          @click="$emit('requestNotifications')" 
          class="btn btn-toggle"
          :class="{ active: notificationsEnabled }"
          :disabled="notificationPermission === 'denied'"
        >
          {{ notificationButtonText }}
        </button>
      </div>

      <div class="setting-item setting-row">
        <label class="setting-label">Urgency warning</label>
        <button 
          @click="$emit('toggleUrgencyWarning')"
          class="btn btn-toggle"
          :class="{ active: urgencyWarningEnabled }"
        >
          {{ urgencyWarningEnabled ? '⚠️ On' : '✗ Off' }}
        </button>
      </div>

      <div class="setting-item setting-row">
        <label class="setting-label">Keep screen on</label>
        <button 
          @click="$emit('toggleWakeLock')"
          class="btn btn-toggle"
          :class="{ active: wakeLockEnabled }"
          :disabled="!wakeLockSupported"
        >
          {{ wakeLockButtonText }}
        </button>
      </div>

      <div class="setting-item setting-row">
        <label class="setting-label">Theme</label>
        <button @click="$emit('toggleTheme')" class="btn btn-toggle">
          {{ theme === 'dark' ? '🌙 Dark' : '☀️ Light' }}
        </button>
      </div>

      <div class="setting-item setting-row">
        <label class="setting-label">Compact mode</label>
        <button 
          @click="$emit('toggleCompact')"
          class="btn btn-toggle"
          :class="{ active: compactMode }"
        >
          {{ compactMode ? '✓ On' : '✗ Off' }}
        </button>
      </div>
    </div>

    <div class="settings-divider"></div>

    <button class="btn btn-danger" @click="$emit('clearData')">
      Reset All Data
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TimerConfig, Theme } from '../composables'

const props = defineProps<{
  config: TimerConfig
  soundEnabled: boolean
  notificationsEnabled: boolean
  notificationPermission: NotificationPermission
  theme: Theme
  wakeLockEnabled: boolean
  wakeLockSupported: boolean
  compactMode: boolean
  urgencyWarningEnabled: boolean
}>()

const emit = defineEmits<{
  'update:config': [config: TimerConfig]
  toggleSound: []
  toggleTheme: []
  toggleWakeLock: []
  toggleCompact: []
  toggleUrgencyWarning: []
  requestNotifications: []
  clearData: []
}>()

const updateConfig = (key: keyof TimerConfig, value: number) => {
  if (isNaN(value) || value < 1) return
  emit('update:config', { ...props.config, [key]: value })
}

const updateConfigBool = (key: keyof TimerConfig, value: boolean) => {
  emit('update:config', { ...props.config, [key]: value })
}

const notificationButtonText = computed(() => {
  if (props.notificationPermission === 'denied') {
    return '🚫 Blocked'
  }
  return props.notificationsEnabled ? '🔔 On' : '🔕 Off'
})

const wakeLockButtonText = computed(() => {
  if (!props.wakeLockSupported) {
    return '🚫 N/A'
  }
  return props.wakeLockEnabled ? '☀️ On' : '🌑 Off'
})
</script>

<style scoped>
.settings-panel {
  /* No padding/border when inside modal */
}

.panel-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin: 0 0 1rem 0;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.settings-divider {
  height: 1px;
  background: var(--border-color);
  margin: 1rem 0;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.setting-row {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.setting-label {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input {
  padding: 0.5rem;
  font-size: 0.875rem;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  transition: border-color 0.15s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.input-number {
  width: 60px;
  text-align: center;
}

.setting-unit {
  font-size: 0.75rem;
  color: var(--text-muted);
  min-width: 24px;
}

.btn-toggle {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-toggle:hover:not(:disabled) {
  background: var(--bg-input);
}

.btn-toggle.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.btn-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  width: 100%;
  padding: 0.5rem;
  font-size: 0.75rem;
  background: transparent;
  border: 1px solid var(--color-primary);
  border-radius: 4px;
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-danger:hover {
  background: var(--color-primary);
  color: white;
}
</style>
