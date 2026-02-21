<template>
  <div class="app" :class="[theme, { 'compact-mode': compactMode }]">
    <header class="header">
      <div class="header-left">
        <h1 class="logo">
          <span class="logo-icon">🍅</span>
          Pomotrack
        </h1>
        <template v-if="isConfigured">
          <button
            @click="handlePull"
            class="sync-btn"
            :disabled="isSyncing"
            title="Pull from Azure — replaces local data"
            aria-label="Pull from Azure"
          >
            <!-- cloud-arrow-down (Heroicons mini 20x20) -->
            <svg
              class="sync-icon"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M5.5 17a4.5 4.5 0 0 1-1.44-8.765 4.5 4.5 0 0 1 8.302-3.046 3.5 3.5 0 0 1 4.504 4.272A4 4 0 0 1 15 17H5.5zm5.25-9.25a.75.75 0 0 0-1.5 0v4.59l-1.95-2.1a.75.75 0 1 0-1.1 1.02l3.25 3.5a.75.75 0 0 0 1.1 0l3.25-3.5a.75.75 0 1 0-1.1-1.02l-1.95 2.1V7.75z"
                clip-rule="evenodd"
              />
            </svg>
            <span>{{ isSyncing ? "…" : "Pull Azure" }}</span>
          </button>
          <button
            @click="handlePush"
            class="sync-btn"
            :disabled="isSyncing"
            title="Push to Azure"
            aria-label="Push to Azure"
          >
            <!-- cloud-arrow-up (Heroicons mini 20x20) -->
            <svg
              class="sync-icon"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M5.5 17a4.5 4.5 0 0 1-1.44-8.765 4.5 4.5 0 0 1 8.302-3.046 3.5 3.5 0 0 1 4.504 4.272A4 4 0 0 1 15 17H5.5zm3.75-2.75a.75.75 0 0 0 1.5 0V9.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0L6.2 10.74a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59z"
                clip-rule="evenodd"
              />
            </svg>
            <span>{{ isSyncing ? "…" : "Push Azure" }}</span>
          </button>
        </template>
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
              :azureConfig="azureConfig"
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
              @updateAzureConfig="azureConfig = $event"
            />
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Sync status toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="syncStatus !== 'idle' && syncStatus !== 'syncing'"
          class="sync-toast"
          :class="syncStatus"
          @click="clearSyncStatus"
        >
          {{ syncMessage }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
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
  useAzureSync,
  defaultConfig,
  clearAllStorage,
  type TimerConfig,
  type SessionType,
} from "./composables";
import { batchPostSessions } from "./api/sessions";
import { createTask as apiCreateTask } from "./api/kanban";

// Azure sync
const {
  config: azureConfig,
  isConfigured,
  isSyncing,
  status: syncStatus,
  message: syncMessage,
  push: syncPush,
  pull: syncPull,
  clearStatus: clearSyncStatus,
} = useAzureSync();

const handlePush = async () => {
  await syncPush();
};
const handlePull = async () => {
  await syncPull();
};

// One-time migration: move old localStorage session/kanban data to the backend
onMounted(async () => {
  const legacySessionsKey = "pomotrack-session-history";
  const legacyKanbanKey = "pomotrack-kanban";

  const rawSessions = localStorage.getItem(legacySessionsKey);
  if (rawSessions) {
    let sessionsMigrated = false;
    try {
      const parsed = JSON.parse(rawSessions);
      const entries = parsed?.data?.entries ?? parsed?.entries ?? [];
      if (Array.isArray(entries) && entries.length > 0) {
        await batchPostSessions(entries);
        console.info(
          `[migration] Migrated ${entries.length} sessions from localStorage`,
        );
      }
      sessionsMigrated = true;
    } catch (e) {
      console.error("[migration] Failed to migrate sessions:", e);
    }
    if (sessionsMigrated) {
      localStorage.removeItem(legacySessionsKey);
    }
  }

  const rawKanban = localStorage.getItem(legacyKanbanKey);
  if (rawKanban) {
    let kanbanMigrated = false;
    try {
      const parsed = JSON.parse(rawKanban);
      const tasks = parsed?.data?.tasks ?? parsed?.tasks ?? [];
      if (Array.isArray(tasks) && tasks.length > 0) {
        for (const task of tasks) {
          await apiCreateTask(task);
        }
        console.info(
          `[migration] Migrated ${tasks.length} kanban tasks from localStorage`,
        );
      }
      kanbanMigrated = true;
    } catch (e) {
      console.error("[migration] Failed to migrate kanban tasks:", e);
    }
    if (kanbanMigrated) {
      localStorage.removeItem(legacyKanbanKey);
    }
  }

  // Auto-dismiss sync status after 4 seconds
  watch(syncStatus, (val) => {
    if (val === "success" || val === "error") {
      setTimeout(clearSyncStatus, 4000);
    }
  });
});

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
  gap: 0.75rem;
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

.sync-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
  line-height: 1;
  white-space: nowrap;
}

.sync-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.sync-btn:hover:not(:disabled) {
  background: var(--bg-subtle);
  color: var(--text-primary);
  border-color: var(--text-muted);
}

.sync-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sync-toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  z-index: 2000;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  white-space: nowrap;
}

.sync-toast.success {
  background: #22c55e;
  color: #fff;
}

.sync-toast.error {
  background: #ef4444;
  color: #fff;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
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
