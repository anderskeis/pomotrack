<template>
  <div
    class="app"
    :class="[theme, `preset-${themePresetId}`, { 'compact-mode': compactMode }]"
    :data-theme-preset="themePresetId"
  >
    <div v-if="activeThemePreset.backgroundImage" class="theme-bg-layer" aria-hidden="true"></div>
    <header class="header">
      <div class="header-left">
        <h1 class="logo">
          <span class="logo-icon">
            <ThemeIcon
              :themeId="themePresetId"
              slot="logo"
              :fallback="activeThemePreset.icons.logo"
            />
          </span>
          <span class="logo-text-group">
            <span class="logo-title">{{ activeThemePreset.labels.appTitle }}</span>
            <span
              v-if="activeThemePreset.labels.appSubtitle"
              class="logo-subtitle"
            >
              {{ activeThemePreset.labels.appSubtitle }}
            </span>
          </span>
        </h1>
        <template v-if="isConfigured">
          <button
            @click="handlePull"
            class="sync-btn"
            :disabled="isSyncing"
            title="Pull from Azure — merge with local data"
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
          <!-- sun (Heroicons mini 20x20) — shown in dark mode -->
          <svg
            v-if="theme === 'dark'"
            class="header-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10 2C10.4142 2 10.75 2.33579 10.75 2.75V4.25C10.75 4.66421 10.4142 5 10 5C9.58579 5 9.25 4.66421 9.25 4.25V2.75C9.25 2.33579 9.58579 2 10 2Z" />
            <path d="M10 15C10.4142 15 10.75 15.3358 10.75 15.75V17.25C10.75 17.6642 10.4142 18 10 18C9.58579 18 9.25 17.6642 9.25 17.25V15.75C9.25 15.3358 9.58579 15 10 15Z" />
            <path d="M10 7C8.34315 7 7 8.34315 7 10C7 11.6569 8.34315 13 10 13C11.6569 13 13 11.6569 13 10C13 8.34315 11.6569 7 10 7Z" />
            <path d="M15.6568 5.40386C15.9497 5.11096 15.9497 4.63609 15.6568 4.3432C15.3639 4.0503 14.889 4.0503 14.5961 4.3432L13.5355 5.40386C13.2426 5.69675 13.2426 6.17162 13.5355 6.46452C13.8284 6.75741 14.3032 6.75741 14.5961 6.46452L15.6568 5.40386Z" />
            <path d="M6.46441 14.5962C6.7573 14.3034 6.7573 13.8285 6.46441 13.5356C6.17151 13.2427 5.69664 13.2427 5.40375 13.5356L4.34309 14.5962C4.05019 14.8891 4.05019 15.364 4.34309 15.6569C4.63598 15.9498 5.11085 15.9498 5.40375 15.6569L6.46441 14.5962Z" />
            <path d="M18 10C18 10.4142 17.6642 10.75 17.25 10.75H15.75C15.3358 10.75 15 10.4142 15 10C15 9.58579 15.3358 9.25 15.75 9.25H17.25C17.6642 9.25 18 9.58579 18 10Z" />
            <path d="M5 10C5 10.4142 4.66421 10.75 4.25 10.75H2.75C2.33579 10.75 2 10.4142 2 10C2 9.58579 2.33579 9.25 2.75 9.25H4.25C4.66421 9.25 5 9.58579 5 10Z" />
            <path d="M14.596 15.6568C14.8889 15.9497 15.3638 15.9497 15.6567 15.6568C15.9496 15.3639 15.9496 14.889 15.6567 14.5961L14.596 13.5355C14.3031 13.2426 13.8283 13.2426 13.5354 13.5355C13.2425 13.8284 13.2425 14.3032 13.5354 14.5961L14.596 15.6568Z" />
            <path d="M5.40363 6.46441C5.69653 6.7573 6.1714 6.7573 6.46429 6.46441C6.75719 6.17151 6.75719 5.69664 6.46429 5.40375L5.40363 4.34309C5.11074 4.05019 4.63587 4.05019 4.34297 4.34309C4.05008 4.63598 4.05008 5.11085 4.34297 5.40375L5.40363 6.46441Z" />
          </svg>
          <!-- moon (Heroicons mini 20x20) — shown in light mode -->
          <svg
            v-else
            class="header-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M7.45519 2.00395C7.68518 2.18765 7.78646 2.4889 7.71414 2.77423C7.57443 3.32547 7.5 3.90348 7.5 4.49996C7.5 8.36595 10.634 11.5 14.5 11.5C15.6435 11.5 16.721 11.2263 17.6724 10.7417C17.9347 10.608 18.2509 10.6402 18.4809 10.8239C18.7109 11.0076 18.8122 11.3089 18.7399 11.5942C17.8069 15.2755 14.4725 18 10.5 18C5.80558 18 2 14.1944 2 9.49996C2 6.19139 3.89048 3.32567 6.64671 1.92168C6.909 1.78807 7.22519 1.82025 7.45519 2.00395Z"
            />
          </svg>
        </button>
        <button
          @click="showSettingsModal = true"
          class="settings-toggle"
          title="Settings"
          aria-label="Settings"
        >
          <!-- cog-6-tooth (Heroicons mini 20x20) -->
          <svg
            class="header-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M7.83922 1.80388C7.93271 1.33646 8.34312 1 8.81981 1H11.1802C11.6569 1 12.0673 1.33646 12.1608 1.80388L12.4913 3.45629C13.1956 3.72458 13.8454 4.10332 14.4196 4.57133L16.0179 4.03065C16.4694 3.8779 16.966 4.06509 17.2043 4.47791L18.3845 6.52207C18.6229 6.93489 18.5367 7.45855 18.1786 7.77322L16.9119 8.88645C16.9699 9.24909 17 9.62103 17 10C17 10.379 16.9699 10.7509 16.9119 11.1135L18.1786 12.2268C18.5367 12.5414 18.6229 13.0651 18.3845 13.4779L17.2043 15.5221C16.966 15.9349 16.4694 16.1221 16.0179 15.9693L14.4196 15.4287C13.8454 15.8967 13.1956 16.2754 12.4913 16.5437L12.1608 18.1961C12.0673 18.6635 11.6569 19 11.1802 19H8.81981C8.34312 19 7.93271 18.6635 7.83922 18.1961L7.50874 16.5437C6.80443 16.2754 6.1546 15.8967 5.58043 15.4287L3.98214 15.9694C3.5306 16.1221 3.03401 15.9349 2.79567 15.5221L1.61547 13.4779C1.37713 13.0651 1.4633 12.5415 1.82136 12.2268L3.08808 11.1135C3.03012 10.7509 3 10.379 3 10C3 9.62103 3.03012 9.2491 3.08808 8.88647L1.82136 7.77324C1.46331 7.45857 1.37713 6.93491 1.61547 6.52209L2.79567 4.47793C3.03401 4.06511 3.5306 3.87791 3.98214 4.03066L5.58042 4.57134C6.15459 4.10332 6.80442 3.72459 7.50874 3.45629L7.83922 1.80388ZM10 13C11.6569 13 13 11.6569 13 10C13 8.34315 11.6569 7 10 7C8.34315 7 7 8.34315 7 10C7 11.6569 8.34315 13 10 13Z"
            />
          </svg>
        </button>
      </div>
    </header>

    <main class="main">
      <div class="dashboard">
        <!-- Timer Section -->
        <section class="timer-section themed-panel">
          <TimerDisplay
            :formattedTime="formattedTime"
            :sessionType="sessionType"
            :currentLabel="activeLabel"
            :urgencyLevel="urgencyWarningEnabled ? urgencyLevel : 'normal'"
            :isRunning="isRunning"
            :progress="progress"
            :completedPomodoros="completedPomodoros"
            :pomodorosUntilLongBreak="config.pomodorosUntilLongBreak"
            :themeId="themePresetId"
            :themeIcons="activeThemePreset.icons"
            :modeLabels="activeThemePreset.labels.modes"
            @selectMode="handleSelectMode"
          />
          <TimerControls
            :isRunning="isRunning"
            :labels="activeThemePreset.labels.controls"
            @start="handleStart"
            @pause="pause"
            @skip="handleSkip"
            @reset="handleReset"
          />
          <div class="keyboard-hint" v-if="!isRunning">
            <span class="hint">
              {{ activeThemePreset.labels.controls.spaceHintBefore }}
              <kbd>Space</kbd>
              {{ activeThemePreset.labels.controls.spaceHintAfter }}
            </span>
          </div>
        </section>

        <!-- Sidebar -->
        <aside class="sidebar">
          <KanbanPanel
            v-if="kanbanEnabled"
            :themeId="themePresetId"
            :labels="activeThemePreset.labels.kanban"
          />
          <SessionLabel
            v-else
            v-model="sessionLabel"
            :recentLabels="recentLabels"
            :labels="activeThemePreset.labels.sessionLabel"
          />

          <StatsPanel
            :completedPomodoros="completedPomodoros"
            :completedBreaks="completedBreaks"
            :focusDuration="config.focusDuration"
            :dailyGoal="config.dailyGoal"
            :hasHistory="history.entries.length > 0"
            :themeId="themePresetId"
            :themeIcons="activeThemePreset.icons"
            :labels="activeThemePreset.labels.stats"
            @showSummary="showSummaryModal = true"
          />
        </aside>
      </div>
    </main>

    <footer class="footer">
      <p>{{ activeThemePreset.tagline }}</p>
    </footer>

    <!-- Summary Modal -->
    <Teleport to="body">
      <SummaryModal
        v-if="showSummaryModal"
        :todayEntries="todayEntries"
        :weekEntries="weekEntries"
        :monthEntries="monthEntries"
        @close="showSummaryModal = false"
      />

      <!-- Pull Confirmation Modal -->
      <PullConfirmationModal
        :visible="showConfirmation"
        :preview="preview"
        :conflictStrategy="conflictStrategy"
        @confirm="handleConfirmPull"
        @cancel="handleCancelPull"
      />

      <!-- Clear Data Confirmation Modal -->
      <ConfirmModal
        :visible="showClearConfirm"
        title="⚠️ Clear All Data?"
        message="This will permanently delete all your settings, session history and kanban tasks."
        warning="This action cannot be undone."
        confirm-label="Clear All Data"
        cancel-label="Cancel"
        danger
        @confirm="confirmClearData"
        @cancel="showClearConfirm = false"
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
              :themePresetId="themePresetId"
              :availableThemes="availableThemes"
              :wakeLockEnabled="wakeLockEnabled"
              :wakeLockSupported="wakeLockSupported"
              :compactMode="compactMode"
              :urgencyWarningEnabled="urgencyWarningEnabled"
              :kanbanEnabled="kanbanEnabled"
              :azureConfig="azureConfig"
              :autoSyncEnabled="autoSyncEnabled"
              @update:config="config = $event"
              @toggleSound="soundEnabled = !soundEnabled"
              @toggleTheme="toggleTheme"
              @selectThemePreset="setThemePreset"
              @requestNotifications="handleRequestNotifications"
              @toggleWakeLock="wakeLockEnabled = !wakeLockEnabled"
              @toggleCompact="compactMode = !compactMode"
              @toggleUrgencyWarning="
                urgencyWarningEnabled = !urgencyWarningEnabled
              "
              @toggleKanban="kanbanEnabled = !kanbanEnabled"
              @toggleAutoSync="autoSyncEnabled = !autoSyncEnabled"
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
          v-if="syncStatus !== 'idle'"
          class="sync-toast"
          :class="syncStatus"
          :role="syncStatus === 'error' ? 'alert' : 'status'"
          @click="syncStatus !== 'syncing' && clearSyncStatus()"
        >
          {{ syncMessage }}
        </div>
      </Transition>
    </Teleport>

    <!-- Goal reached celebratory toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="showGoalToast"
          class="goal-toast"
          role="status"
          @click="showGoalToast = false"
        >
          <div class="goal-toast-content">
            <span class="goal-toast-icon">🏆</span>
            <div class="goal-toast-text">
              <h4>{{ activeThemePreset.labels.goalToast.title }}</h4>
              <p>{{ activeThemePreset.labels.goalToast.message.replace('{goal}', String(config.dailyGoal)) }}</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  TimerDisplay,
  TimerControls,
  SessionLabel,
  StatsPanel,
  SettingsPanel,
  KanbanPanel,
  SummaryModal,
  PullConfirmationModal,
  ConfirmModal,
  ThemeIcon,
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
  showConfirmation,
  preview,
  conflictStrategy,
  status: syncStatus,
  message: syncMessage,
  push: syncPush,
  pull: syncPull,
  confirmPull,
  cancelPull,
  silentPull,
  clearStatus: clearSyncStatus,
} = useAzureSync();

const handlePush = async () => {
  await syncPush();
};
const handlePull = async () => {
  await syncPull();
};
const handleConfirmPull = (strategy: "keep_local" | "keep_cloud" | "keep_newer") => {
  confirmPull(true, strategy);
};
const handleCancelPull = () => {
  cancelPull();
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

  // Auto-pull on startup if enabled
  if (autoSyncEnabled.value && isConfigured.value) {
    silentPull();
  }
});

// Theme
const {
  theme,
  themePresetId,
  activeThemePreset,
  availableThemes,
  toggleTheme,
  setThemePreset,
} = useTheme();

// Session label (ephemeral)
const sessionLabel = ref("");
const showGoalToast = ref(false);

// Persisted settings
const soundEnabled = useStorage("sound-enabled", true);
const notificationsEnabled = useStorage("notifications-enabled", false);
const wakeLockEnabled = useStorage("wake-lock-enabled", false);
const compactMode = useStorage("compact-mode", false);
const urgencyWarningEnabled = useStorage("urgency-warning-enabled", true);
const kanbanEnabled = useStorage("kanban-enabled", false);
const autoSyncEnabled = useStorage("auto-sync-enabled", false);

// Kanban board
const { activeTask, incrementActiveTaskPomodoros, clearAllTasks } = useKanban();

// Active label displayed on the timer (uses active Kanban task when Kanban is enabled)
const activeLabel = computed(() =>
  kanbanEnabled.value && activeTask.value
    ? activeTask.value.title
    : sessionLabel.value,
);

// Session history
const {
  history,
  todayStats,
  todayEntries,
  weekEntries,
  monthEntries,
  recordSession,
  recentLabels,
  clearHistory,
} = useSessionHistory();

// Modals
const showSummaryModal = ref(false);
const showSettingsModal = ref(false);
const showClearConfirm = ref(false);

// Audio
const audio = useAudio("/sounds/bell.wav");

// Notifications
const {
  permission: notificationPermission,
  requestPermission,
  notifySessionComplete,
  notifyGoalReached,
} = useNotifications();

// Timer config - persisted
const config = useStorage<TimerConfig>("timer-config", defaultConfig);

// Track session start time for history
let sessionStartTime = 0;
// True once a session has been started (prevents overwriting startedAt on resume)
let sessionInProgress = false;

// Called when a session auto-starts (after break or focus)
const onSessionStart = () => {
  sessionStartTime = Date.now();
  sessionInProgress = true;
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
  sessionInProgress = false;

  // Auto-push after focus session if enabled
  if (completedSessionType === "focus" && autoSyncEnabled.value && isConfigured.value) {
    syncPush();
  }

  // Check if daily goal was reached (must check after recordSession has updated todayStats)
  if (completedSessionType === "focus" && todayStats.value.focusCount === config.value.dailyGoal) {
    if (notificationsEnabled.value) {
      notifyGoalReached(config.value.dailyGoal);
    }
    showGoalToast.value = true;
    setTimeout(() => {
      showGoalToast.value = false;
    }, 6000);
  }

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
  setSessionType,
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
  // Only record start time when beginning a fresh session, not resuming after pause
  if (!sessionInProgress) {
    sessionStartTime = Date.now();
    sessionInProgress = true;
  }

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

// Handle clear all data — show confirmation modal first
const handleClearData = () => {
  showClearConfirm.value = true;
};

const confirmClearData = () => {
  showClearConfirm.value = false;
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
  setThemePreset("default");
  config.value = { ...defaultConfig };
};

const handleSkip = () => {
  sessionInProgress = false;
  skip();
};

const handleReset = () => {
  sessionInProgress = false;
  reset();
};

const handleSelectMode = (type: SessionType) => {
  sessionInProgress = false;
  setSessionType(type);
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
    skip: handleSkip,
    reset: handleReset,
    closeModals: () => {
      showSummaryModal.value = false;
      showSettingsModal.value = false;
      showClearConfirm.value = false;
    },
  },
  () => isRunning.value,
);

// Update document title with timer
watch([formattedTime, sessionType, activeThemePreset], ([time, type, preset]) => {
  const icon =
    type === "focus"
      ? preset.icons.focus
      : type === "short-break"
        ? preset.icons.shortBreak
        : preset.icons.longBreak;
  document.title = `${time} ${icon} Pomotrack`;
});
</script>

<style scoped>
.app {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-body, inherit);
}

.theme-bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image: var(--theme-bg-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  pointer-events: none;
}

.theme-bg-layer::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    rgba(0, 0, 0, 0.35) 0%,
    rgba(0, 0, 0, 0.72) 100%
  );
}

.app.light .theme-bg-layer::after {
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.72) 0%,
    rgba(255, 255, 255, 0.88) 100%
  );
}

.header,
.main,
.footer {
  position: relative;
  z-index: 1;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.625rem 1.5rem;
  background: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(8px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 1.25rem;
  font-weight: 700;
  font-family: var(--font-heading, inherit);
  margin: 0;
  color: var(--text-primary);
}

.logo-icon {
  font-size: 1.5rem;
  color: var(--color-primary);
  display: inline-flex;
  align-items: center;
}

.logo-text-group {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.logo-title {
  letter-spacing: 0.04em;
}

.logo-subtitle {
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--color-primary);
  opacity: 0.9;
}

.theme-toggle {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.15s ease, color 0.15s ease;
}

.theme-toggle:hover {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.settings-toggle {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.15s ease, color 0.15s ease;
}

.settings-toggle:hover {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.header-icon {
  width: 1.25rem;
  height: 1.25rem;
  display: block;
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

.sync-toast.syncing {
  background: var(--bg-secondary, #374151);
  color: var(--text-primary);
  cursor: default;
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
  padding: 1rem 1.5rem;
}

.dashboard {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.25rem;
  align-items: start;
}

.timer-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
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
  padding: 0.5rem 1.5rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.75rem;
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
.compact-mode .header {
  padding: 0.375rem 1rem;
}

.compact-mode .main {
  padding: 0.5rem 1rem;
}

.compact-mode .dashboard {
  gap: 0.75rem;
}

.compact-mode .timer-section {
  padding: 0.75rem;
  gap: 0.5rem;
}

.compact-mode .footer {
  padding: 0.25rem 1rem;
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

/* Goal reached celebratory toast */
.goal-toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(239, 68, 68, 0.4);
  cursor: pointer;
  z-index: 2000;
  max-width: 350px;
  animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.goal-toast-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.goal-toast-icon {
  font-size: 2.25rem;
  animation: bounce 1s infinite alternate;
}

.goal-toast-text h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #ffffff;
}

.goal-toast-text p {
  margin: 0.25rem 0 0 0;
  font-size: 0.8125rem;
  opacity: 0.95;
  line-height: 1.3;
  color: #ffffff;
}

@keyframes slide-in {
  from {
    transform: translateY(20px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes bounce {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-6px);
  }
}

@media (max-width: 640px) {
  .goal-toast {
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%) !important;
    width: 90%;
    max-width: 320px;
  }
}
</style>
