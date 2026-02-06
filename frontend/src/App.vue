<template>
  <div class="app" :class="[theme, { 'compact-mode': compactMode }]">
    <header class="header">
      <div class="header-left">
        <h1 class="logo">
          <span class="logo-icon">🍅</span>
          Pomotrack
        </h1>
      </div>
      <div class="header-right">
        <button
          @click="toggleTheme"
          class="theme-toggle"
          :title="`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`"
          :aria-label="`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`"
        >
          {{ theme === "dark" ? "☀️" : "🌙" }}
        </button>
        <button
          @click="showSettingsModal = true"
          class="settings-toggle"
          title="Settings"
          aria-label="Settings"
        >
          ⚙️
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
            :urgencyLevel="urgencyWarningEnabled ? urgencyLevel : 'normal'"
            :isRunning="isRunning"
          />
          <TimerControls
            :isRunning="isRunning"
            @start="handleStart"
            @pause="pause"
            @skip="skip"
            @reset="reset"
          />
          <div class="keyboard-hint" v-if="!isRunning">
            <span class="hint">Press <kbd>Space</kbd> to start</span>
          </div>
        </section>

        <!-- Sidebar -->
        <aside class="sidebar">
          <KanbanPanel v-if="kanbanEnabled" />
          <SessionLabel
            v-else
            v-model="sessionLabel"
            :recentLabels="recentLabels"
          />

          <StatsPanel
            :completedPomodoros="completedPomodoros"
            :completedBreaks="completedBreaks"
            :focusDuration="config.focusDuration"
            :dailyGoal="config.dailyGoal"
            :hasHistory="todayStats.focusCount > 0"
            @showSummary="showSummaryModal = true"
          />
        </aside>
      </div>
    </main>

    <footer class="footer">
      <p>Stay focused. Take breaks. Repeat.</p>
    </footer>

    <!-- Summary Modal -->
    <Teleport to="body">
      <SummaryModal
        v-if="showSummaryModal"
        :stats="todayStats"
        @close="showSummaryModal = false"
      />

      <!-- Settings Modal -->
      <div
        v-if="showSettingsModal"
        class="modal-overlay"
        @click.self="showSettingsModal = false"
      >
        <div class="modal modal-settings">
          <div class="modal-header">
            <h2>⚙️ Settings</h2>
            <button
              class="modal-close"
              aria-label="Close"
              @click="showSettingsModal = false"
            >
              &times;
            </button>
          </div>
          <div class="modal-body">
            <SettingsPanel
              :config="config"
              :soundEnabled="soundEnabled"
              :notificationsEnabled="notificationsEnabled"
              :notificationPermission="notificationPermission"
              :theme="theme"
              :wakeLockEnabled="wakeLockEnabled"
              :wakeLockSupported="wakeLockSupported"
              :compactMode="compactMode"
              :urgencyWarningEnabled="urgencyWarningEnabled"
              :kanbanEnabled="kanbanEnabled"
              @update:config="config = $event"
              @toggleSound="soundEnabled = !soundEnabled"
              @toggleTheme="toggleTheme"
              @requestNotifications="handleRequestNotifications"
              @toggleWakeLock="wakeLockEnabled = !wakeLockEnabled"
              @toggleCompact="compactMode = !compactMode"
              @toggleUrgencyWarning="
                urgencyWarningEnabled = !urgencyWarningEnabled
              "
              @toggleKanban="kanbanEnabled = !kanbanEnabled"
              @clearData="handleClearData"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import {
  TimerDisplay,
  TimerControls,
  SessionLabel,
  StatsPanel,
  SettingsPanel,
  KanbanPanel,
  SummaryModal,
} from "./components";
import {
  useTimer,
  useNotifications,
  useAudio,
  useTheme,
  useStorage,
  useSessionHistory,
  useFavicon,
  useWakeLock,
  useKanban,
  useKeyboardShortcuts,
  defaultConfig,
  clearAllStorage,
  type TimerConfig,
  type SessionType,
} from "./composables";

// Theme
const { theme, toggleTheme } = useTheme();

// Session label (ephemeral)
const sessionLabel = ref("");

// Persisted settings
const soundEnabled = useStorage("sound-enabled", true);
const notificationsEnabled = useStorage("notifications-enabled", false);
const wakeLockEnabled = useStorage("wake-lock-enabled", false);
const compactMode = useStorage("compact-mode", false);
const urgencyWarningEnabled = useStorage("urgency-warning-enabled", true);
const kanbanEnabled = useStorage("kanban-enabled", false);

// Kanban board
const { activeTask, incrementActiveTaskPomodoros, clearAllTasks } = useKanban();

// Session history
const { todayStats, recordSession, recentLabels, clearHistory } =
  useSessionHistory();

// Modals
const showSummaryModal = ref(false);
const showSettingsModal = ref(false);

// Audio
const audio = useAudio("/sounds/bell.mp3");

// Notifications
const {
  permission: notificationPermission,
  requestPermission,
  notifySessionComplete,
} = useNotifications();

// Timer config - persisted
const config = useStorage<TimerConfig>("timer-config", defaultConfig);

// Track session start time for history
let sessionStartTime = 0;

// Called when a session auto-starts (after break or focus)
const onSessionStart = () => {
  sessionStartTime = Date.now();
};

// Handle session completion
const onSessionComplete = (completedSessionType: SessionType) => {
  // Record to history - use active task title as label if kanban is enabled
  const currentLabel =
    kanbanEnabled.value && activeTask.value
      ? activeTask.value.title
      : sessionLabel.value;

  const duration =
    completedSessionType === "focus"
      ? config.value.focusDuration * 60
      : completedSessionType === "short-break"
        ? config.value.shortBreakDuration * 60
        : config.value.longBreakDuration * 60;

  recordSession(completedSessionType, currentLabel, duration, sessionStartTime);

  // Increment pomodoro count on active kanban task
  if (completedSessionType === "focus" && kanbanEnabled.value) {
    incrementActiveTaskPomodoros();
  }

  // Play sound
  if (soundEnabled.value) {
    audio.play();
  }

  // Send notification
  if (notificationsEnabled.value) {
    notifySessionComplete(completedSessionType);
  }

  // Clear label when focus session ends (only if not using kanban)
  if (completedSessionType === "focus" && !kanbanEnabled.value) {
    sessionLabel.value = "";
  }
};

// Timer
const {
  remaining,
  formattedTime,
  isRunning,
  sessionType,
  completedPomodoros,
  completedBreaks,
  progress,
  urgencyLevel,
  start,
  pause,
  skip,
  reset,
} = useTimer(config, onSessionComplete, onSessionStart);

// Dynamic favicon
useFavicon(progress, sessionType, remaining, isRunning);

// Wake lock
const { isSupported: wakeLockSupported } = useWakeLock(
  isRunning,
  wakeLockEnabled,
);

// Request notification permission on first start
const handleStart = async () => {
  // Track session start time
  sessionStartTime = Date.now();

  // Request notification permission if not yet requested
  if (notificationPermission.value === "default") {
    const result = await requestPermission();
    notificationsEnabled.value = result === "granted";
  }

  start();
};

// Handle notification permission request
const handleRequestNotifications = async () => {
  if (notificationPermission.value === "default") {
    const result = await requestPermission();
    notificationsEnabled.value = result === "granted";
  } else if (notificationPermission.value === "granted") {
    notificationsEnabled.value = !notificationsEnabled.value;
  }
};

// Handle clear all data
const handleClearData = () => {
  if (confirm("This will clear all settings and history. Are you sure?")) {
    clearAllStorage();
    clearHistory();
    clearAllTasks();
    // Reset local state
    soundEnabled.value = true;
    notificationsEnabled.value = false;
    wakeLockEnabled.value = false;
    compactMode.value = false;
    kanbanEnabled.value = false;
    urgencyWarningEnabled.value = true;
    config.value = { ...defaultConfig };
  }
};

// Keyboard shortcuts
useKeyboardShortcuts(
  {
    toggleTimer: () => {
      if (isRunning.value) {
        pause();
      } else {
        handleStart();
      }
    },
    skip,
    reset,
    closeModals: () => {
      showSummaryModal.value = false;
      showSettingsModal.value = false;
    },
  },
  () => isRunning.value,
);

// Update document title with timer
watch([formattedTime, sessionType], ([time, type]) => {
  const icon = type === "focus" ? "🍅" : "☕";
  document.title = `${time} ${icon} Pomotrack`;
});
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

.settings-toggle {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.settings-toggle:hover {
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

/* Keyboard hint */
.keyboard-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.keyboard-hint kbd {
  display: inline-block;
  padding: 0.15rem 0.4rem;
  font-family: inherit;
  font-size: 0.7rem;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: 0 1px 0 var(--border-color);
}

/* Compact mode */
.compact-mode .timer-section {
  padding: 1rem;
}

.compact-mode .time {
  font-size: 5rem;
}

.compact-mode .sidebar {
  gap: 0.5rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: auto;
}

.modal-settings {
  max-width: 640px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
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
