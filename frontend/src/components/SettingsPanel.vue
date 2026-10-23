<template>
  <div class="settings-panel">
    <div class="settings-grid">
      <!-- Timer Settings Column -->
      <div class="settings-column">
        <h3 class="panel-title">Timer</h3>
        <div class="settings-group">
          <div class="setting-item">
            <label for="focus-duration" class="setting-label">Focus</label>
            <div class="setting-control">
              <input
                id="focus-duration"
                type="number"
                :value="config.focusDuration"
                @change="
                  updateConfig(
                    'focusDuration',
                    ($event.target as HTMLInputElement).valueAsNumber,
                  )
                "
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
                @change="
                  updateConfig(
                    'shortBreakDuration',
                    ($event.target as HTMLInputElement).valueAsNumber,
                  )
                "
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
                @change="
                  updateConfig(
                    'longBreakDuration',
                    ($event.target as HTMLInputElement).valueAsNumber,
                  )
                "
                min="1"
                max="60"
                class="input input-number"
              />
              <span class="setting-unit">min</span>
            </div>
          </div>

          <div class="setting-item">
            <label for="long-break-interval" class="setting-label"
              >Long Break After</label
            >
            <div class="setting-control">
              <input
                id="long-break-interval"
                type="number"
                :value="config.pomodorosUntilLongBreak"
                @change="
                  updateConfig(
                    'pomodorosUntilLongBreak',
                    ($event.target as HTMLInputElement).valueAsNumber,
                  )
                "
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
                @change="
                  updateConfig(
                    'dailyGoal',
                    ($event.target as HTMLInputElement).valueAsNumber,
                  )
                "
                min="1"
                max="20"
                class="input input-number"
              />
              <span class="setting-unit">🍅</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Behavior Column -->
      <div class="settings-column">
        <h3 class="panel-title">Behavior</h3>
        <div class="settings-group">
          <div class="setting-item setting-row">
            <label class="setting-label">Auto-start breaks</label>
            <button
              @click="
                updateConfigBool('autoStartBreaks', !config.autoStartBreaks)
              "
              class="btn btn-toggle"
              :class="{ active: config.autoStartBreaks }"
            >
              {{ config.autoStartBreaks ? "✓ On" : "✗ Off" }}
            </button>
          </div>

          <div class="setting-item setting-row">
            <label class="setting-label">Auto-start focus</label>
            <button
              @click="
                updateConfigBool('autoStartFocus', !config.autoStartFocus)
              "
              class="btn btn-toggle"
              :class="{ active: config.autoStartFocus }"
            >
              {{ config.autoStartFocus ? "✓ On" : "✗ Off" }}
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
        </div>
      </div>

      <!-- Alerts Column -->
      <div class="settings-column">
        <h3 class="panel-title">Alerts</h3>
        <div class="settings-group">
          <div class="setting-item setting-row">
            <label class="setting-label">Sound</label>
            <button
              @click="$emit('toggleSound')"
              class="btn btn-toggle"
              :class="{ active: soundEnabled }"
            >
              {{ soundEnabled ? "🔔 On" : "🔕 Off" }}
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
              {{ urgencyWarningEnabled ? "⚠️ On" : "✗ Off" }}
            </button>
          </div>
        </div>
      </div>

      <!-- Display & Features Column -->
      <div class="settings-column">
        <h3 class="panel-title">Display</h3>
        <div class="settings-group">
          <div class="setting-item setting-row">
            <label class="setting-label">Mode</label>
            <button @click="$emit('toggleTheme')" class="btn btn-toggle">
              {{ theme === "dark" ? "🌙 Dark" : "☀️ Light" }}
            </button>
          </div>

          <div class="setting-item setting-row">
            <label class="setting-label">Compact mode</label>
            <button
              @click="$emit('toggleCompact')"
              class="btn btn-toggle"
              :class="{ active: compactMode }"
            >
              {{ compactMode ? "✓ On" : "✗ Off" }}
            </button>
          </div>

          <div class="setting-item setting-row">
            <label class="setting-label">Kanban board</label>
            <button
              @click="$emit('toggleKanban')"
              class="btn btn-toggle"
              :class="{ active: kanbanEnabled }"
            >
              {{ kanbanEnabled ? "📋 On" : "✗ Off" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Theme Presets Section -->
    <div v-if="availableThemes && availableThemes.length > 0" class="theme-presets-section">
      <h3 class="panel-title">Theme</h3>
      <div class="theme-cards" role="radiogroup" aria-label="Select theme">
        <button
          v-for="preset in availableThemes"
          :key="preset.id"
          type="button"
          role="radio"
          :aria-checked="themePresetId === preset.id"
          class="theme-card"
          :class="{ active: themePresetId === preset.id }"
          @click="$emit('selectThemePreset', preset.id)"
        >
          <div
            class="theme-card-banner"
            :style="{
              backgroundColor: preset.colors[theme]['--bg-primary'],
              backgroundImage: preset.backgroundImage
                ? `url('${preset.backgroundImage}')`
                : 'none',
              borderColor: preset.colors[theme]['--border-color'],
            }"
          >
            <span
              class="theme-swatches"
              aria-hidden="true"
            >
              <span
                class="theme-swatch"
                :style="{ background: preset.colors[theme]['--color-focus'] }"
              ></span>
              <span
                class="theme-swatch"
                :style="{ background: preset.colors[theme]['--color-short-break'] }"
              ></span>
              <span
                class="theme-swatch"
                :style="{ background: preset.colors[theme]['--color-long-break'] }"
              ></span>
            </span>
          </div>
          <div class="theme-card-header">
            <span
              class="theme-card-icon"
              :style="{ color: preset.colors[theme]['--color-primary'] }"
              aria-hidden="true"
            >
              <ThemeIcon :themeId="preset.id" slot="logo" :fallback="preset.icon" />
            </span>
            <span class="theme-card-name">{{ preset.name }}</span>
          </div>
          <span class="theme-card-desc">{{ preset.description }}</span>
        </button>
      </div>
    </div>

    <!-- Cloud Sync Section -->
    <div class="cloud-sync-section">
      <h3 class="panel-title">Cloud Sync (Azure Blob)</h3>
      <p class="sync-hint">
        Credentials are stored locally and sent to the backend only when you
        sync.
      </p>
      <div class="sync-fields">
        <div class="setting-item">
          <label for="az-account" class="setting-label">Account Name</label>
          <input
            id="az-account"
            type="text"
            class="input sync-input"
            :value="azureConfig.accountName"
            placeholder="mystorageaccount"
            autocomplete="off"
            @input="
              emit('updateAzureConfig', {
                ...azureConfig,
                accountName: ($event.target as HTMLInputElement).value,
              })
            "
          />
        </div>
        <div class="setting-item">
          <label for="az-container" class="setting-label">Container Name</label>
          <input
            id="az-container"
            type="text"
            class="input sync-input"
            :value="azureConfig.containerName"
            placeholder="pomotrack"
            autocomplete="off"
            @input="
              emit('updateAzureConfig', {
                ...azureConfig,
                containerName: ($event.target as HTMLInputElement).value,
              })
            "
          />
        </div>
        <div class="setting-item">
          <label for="az-key" class="setting-label">Access Key</label>
          <input
            id="az-key"
            type="password"
            class="input sync-input"
            :value="azureConfig.accountKey"
            placeholder="••••••••"
            autocomplete="off"
            @input="
              emit('updateAzureConfig', {
                ...azureConfig,
                accountKey: ($event.target as HTMLInputElement).value,
              })
            "
          />
        </div>
      </div>
      <div v-if="azureConfig.accountName && azureConfig.containerName && azureConfig.accountKey" class="setting-item" style="margin-top: 0.75rem;">
        <label class="setting-label">Auto-sync</label>
        <div class="setting-hint" style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.35rem;">Push after each session · Pull on startup</div>
        <button
          class="btn-toggle"
          :class="{ active: autoSyncEnabled }"
          @click="$emit('toggleAutoSync')"
        >
          {{ autoSyncEnabled ? '✓ On' : '✗ Off' }}
        </button>
      </div>
    </div>

    <div class="settings-footer">
      <button class="btn btn-danger" @click="$emit('clearData')">
        Reset All Data
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type {
  TimerConfig,
  Theme,
  ThemePreset,
  ThemePresetId,
  AzureConfig,
} from "../composables";
import ThemeIcon from "./ThemeIcon.vue";

const props = defineProps<{
  config: TimerConfig;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  notificationPermission: NotificationPermission;
  theme: Theme;
  themePresetId?: ThemePresetId;
  availableThemes?: ThemePreset[];
  wakeLockEnabled: boolean;
  wakeLockSupported: boolean;
  compactMode: boolean;
  urgencyWarningEnabled: boolean;
  kanbanEnabled: boolean;
  azureConfig: AzureConfig;
  autoSyncEnabled: boolean;
}>();

const emit = defineEmits<{
  "update:config": [config: TimerConfig];
  toggleSound: [];
  toggleTheme: [];
  selectThemePreset: [presetId: ThemePresetId];
  toggleWakeLock: [];
  toggleCompact: [];
  toggleUrgencyWarning: [];
  toggleKanban: [];
  requestNotifications: [];
  clearData: [];
  updateAzureConfig: [config: AzureConfig];
  toggleAutoSync: [];
}>();

const updateConfig = (key: keyof TimerConfig, value: number) => {
  if (isNaN(value) || value < 1) return;
  emit("update:config", { ...props.config, [key]: value });
};

const updateConfigBool = (key: keyof TimerConfig, value: boolean) => {
  emit("update:config", { ...props.config, [key]: value });
};

const notificationButtonText = computed(() => {
  if (props.notificationPermission === "denied") {
    return "🚫 Blocked";
  }
  return props.notificationsEnabled ? "🔔 On" : "🔕 Off";
});

const wakeLockButtonText = computed(() => {
  if (!props.wakeLockSupported) {
    return "🚫 N/A";
  }
  return props.wakeLockEnabled ? "☀️ On" : "🌑 Off";
});
</script>

<style scoped>
.settings-panel {
  /* Grid container for columns */
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem 2rem;
}

.settings-column {
  min-width: 0;
}

.panel-title {
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-primary);
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.settings-footer {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.setting-row {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.setting-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input {
  padding: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
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
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 28px;
}

.btn-toggle {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 70px;
}

.btn-toggle:hover:not(:disabled) {
  background: var(--bg-input);
  border-color: var(--text-muted);
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
  padding: 0.625rem;
  font-size: 0.8125rem;
  font-weight: 600;
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

.theme-presets-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.theme-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.theme-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  padding: 0.5rem;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.theme-card-banner {
  width: 100%;
  height: 44px;
  border-radius: 5px;
  background-size: cover;
  background-position: center;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 0.3rem 0.4rem;
}

.theme-card:hover {
  border-color: var(--text-muted);
  background: var(--bg-input);
}

.theme-card.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
  background: var(--bg-input);
}

.theme-card-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  width: 100%;
}

.theme-card-icon {
  font-size: 1rem;
  line-height: 1;
}

.theme-card-name {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-primary);
}

.theme-swatches {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  margin-left: auto;
}

.theme-swatch {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.theme-card-desc {
  font-size: 0.6875rem;
  color: var(--text-secondary);
  line-height: 1.3;
}

.cloud-sync-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.sync-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0 0 0.75rem 0;
}

.sync-fields {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem 1rem;
}

.sync-input {
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 600px) {
  .theme-cards {
    grid-template-columns: 1fr;
  }

  .sync-fields {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 500px) {
  .settings-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
}
</style>
