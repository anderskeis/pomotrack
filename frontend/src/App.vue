<template>
  <div class="app" :class="theme">
    <header class="header">
      <div class="header-left">
        <h1 class="logo">
          <span class="logo-icon">🍅</span>
          Pomotrack
        </h1>
      </div>
      <div class="header-right">
        <button @click="toggleTheme" class="theme-toggle" :title="`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`">
          {{ theme === 'dark' ? '☀️' : '🌙' }}
        </button>
      </div>
    </header>

    <main class="main">
      <div class="dashboard">
        <!-- Timer Section -->
        <section class="timer-section">
          <TimerDisplay
            :formattedTime="formattedTime"
            :sessionType="sessionType"
            :currentLabel="sessionLabel"
          />
          <TimerControls
            :isRunning="isRunning"
            @start="handleStart"
            @pause="pause"
            @skip="skip"
            @reset="reset"
          />
        </section>

        <!-- Sidebar -->
        <aside class="sidebar">
          <SessionLabel v-model="sessionLabel" />
          
          <StatsPanel
            :completedPomodoros="completedPomodoros"
            :completedBreaks="completedBreaks"
            :focusDuration="config.focusDuration"
          />
          
          <SettingsPanel
            :config="config"
            :soundEnabled="soundEnabled"
            :notificationsEnabled="notificationsEnabled"
            :notificationPermission="notificationPermission"
            :theme="theme"
            @update:config="config = $event"
            @toggleSound="soundEnabled = !soundEnabled"
            @toggleTheme="toggleTheme"
            @requestNotifications="handleRequestNotifications"
          />
        </aside>
      </div>
    </main>

    <footer class="footer">
      <p>Stay focused. Take breaks. Repeat.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
  TimerDisplay, 
  TimerControls, 
  SessionLabel, 
  StatsPanel, 
  SettingsPanel 
} from './components'
import { 
  useTimer, 
  useNotifications, 
  useAudio, 
  useTheme,
  type TimerConfig,
  type SessionType
} from './composables'

// Theme
const { theme, toggleTheme } = useTheme()

// Session label (ephemeral)
const sessionLabel = ref('')

// Sound & notifications settings
const soundEnabled = ref(true)
const notificationsEnabled = ref(false)

// Audio
const audio = useAudio('/sounds/bell.mp3')

// Notifications
const { 
  permission: notificationPermission, 
  requestPermission,
  notifySessionComplete 
} = useNotifications()

// Timer config
const config = ref<TimerConfig>({
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  pomodorosUntilLongBreak: 4,
})

// Handle session completion
const onSessionComplete = (completedSessionType: SessionType) => {
  // Play sound
  if (soundEnabled.value) {
    audio.play()
  }
  
  // Send notification
  if (notificationsEnabled.value) {
    notifySessionComplete(completedSessionType)
  }
  
  // Clear label when focus session ends
  if (completedSessionType === 'focus') {
    sessionLabel.value = ''
  }
}

// Timer
const {
  formattedTime,
  isRunning,
  sessionType,
  completedPomodoros,
  completedBreaks,
  start,
  pause,
  skip,
  reset,
} = useTimer(config, onSessionComplete)

// Request notification permission on first start
const handleStart = async () => {
  // Request notification permission if not yet requested
  if (notificationPermission.value === 'default') {
    const result = await requestPermission()
    notificationsEnabled.value = result === 'granted'
  }
  
  start()
}

// Handle notification permission request
const handleRequestNotifications = async () => {
  if (notificationPermission.value === 'default') {
    const result = await requestPermission()
    notificationsEnabled.value = result === 'granted'
  } else if (notificationPermission.value === 'granted') {
    notificationsEnabled.value = !notificationsEnabled.value
  }
}

// Update document title with timer
watch([formattedTime, sessionType], ([time, type]) => {
  const icon = type === 'focus' ? '🍅' : '☕'
  document.title = `${time} ${icon} Pomotrack`
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.logo-icon {
  font-size: 1.5rem;
}

.theme-toggle {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.theme-toggle:hover {
  background: var(--bg-subtle);
}

.main {
  flex: 1;
  padding: 2rem;
}

.dashboard {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  align-items: start;
}

.timer-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.footer {
  padding: 1rem 2rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
  border-top: 1px solid var(--border-color);
}

.footer p {
  margin: 0;
}

@media (max-width: 800px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    order: -1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .main {
    padding: 1rem;
  }
  
  .header {
    padding: 1rem;
  }
}
</style>
