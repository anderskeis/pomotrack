import { computed, ref, watch } from "vue";
import { useStorage } from "./useStorage";
import {
  pushToCloud,
  pullFromCloud,
  previewPullFromCloud,
  getSyncInfo,
  type AzureCredentials,
  type PullPreviewResult,
  type PullRequest,
  type SyncInfoResult,
} from "../api/sync";

export interface AzureConfig {
  accountName: string;
  containerName: string;
  accountKey: string;
}

export interface SyncSettings {
  autoPush: boolean;
  autoPushOnChange: boolean;
  autoPull: boolean;
  autoPullInterval: number; // minutes
  conflictStrategy: "keep_local" | "keep_cloud" | "keep_newer";
}

export type SyncStatus = "idle" | "syncing" | "success" | "error" | "warning";

export interface PullPreview {
  newSessions: number;
  newTasks: number;
  updatedSessions: number;
  updatedTasks: number;
  conflictCount: number;
}

export interface SyncState {
  hasUnsyncedChanges: boolean;
  lastPushedAt: string | null;
  lastPulledAt: string | null;
  isOnline: boolean;
}

const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  autoPush: false,
  autoPushOnChange: false,
  autoPull: false,
  autoPullInterval: 15, // minutes
  conflictStrategy: "keep_local",
};

// Singleton state – shared across all useAzureSync() calls
const _status = ref<SyncStatus>("idle");
const _message = ref("");
const _preview = ref<PullPreview | null>(null);
const _showConfirmation = ref(false);
const _conflictStrategy = ref<"keep_local" | "keep_cloud" | "keep_newer">("keep_local");
const _hasUnsyncedChanges = ref(false);
const _lastPushedAt = ref<string | null>(null);
const _lastPulledAt = ref<string | null>(null);
const _isOnline = ref(true);
const _pendingPush = ref<NodeJS.Timeout | null>(null);
const _autoPullInterval = ref<NodeJS.Timeout | null>(null);
const _syncSettings = ref<SyncSettings>(DEFAULT_SYNC_SETTINGS);

export function useAzureSync() {
  const config = useStorage<AzureConfig>("azure-config", {
    accountName: "",
    containerName: "",
    accountKey: "",
  });

  // Sync settings (persisted)
  const syncSettings = useStorage<SyncSettings>("sync-settings", DEFAULT_SYNC_SETTINGS);

  // Sync state (singleton across all calls)
  const isConfigured = computed(
    () =>
      !!(
        config.value.accountName.trim() &&
        config.value.containerName.trim() &&
        config.value.accountKey.trim()
      ),
  );

  const isSyncing = computed(() => _status.value === "syncing");
  const showConfirmation = computed(() => _showConfirmation.value);
  const preview = computed(() => _preview.value);
  const conflictStrategy = computed(() => syncSettings.value.conflictStrategy);
  
  const hasUnsyncedChanges = computed(() => _hasUnsyncedChanges.value);
  const lastPushedAt = computed(() => _lastPushedAt.value);
  const lastPulledAt = computed(() => _lastPulledAt.value);
  const isOnline = computed(() => _isOnline.value);
  const syncState = computed<SyncState>(() => ({
    hasUnsyncedChanges: _hasUnsyncedChanges.value,
    lastPushedAt: _lastPushedAt.value,
    lastPulledAt: _lastPulledAt.value,
    isOnline: _isOnline.value,
  }));

  const setConflictStrategy = (strategy: "keep_local" | "keep_cloud" | "keep_newer") => {
    syncSettings.value.conflictStrategy = strategy;
    _conflictStrategy.value = strategy;
  };

  // Mark that there are unsynced changes
  const markUnsyncedChanges = () => {
    if (!syncSettings.value.autoPushOnChange) return;
    _hasUnsyncedChanges.value = true;
    
    // Auto-push if enabled
    if (syncSettings.value.autoPush && isConfigured.value && !isSyncing.value) {
      scheduleAutoPush();
    }
  };

  // Clear unsynced changes flag
  const clearUnsyncedChanges = () => {
    _hasUnsyncedChanges.value = false;
  };

  // Schedule auto-push (debounced)
  const scheduleAutoPush = () => {
    // Clear existing timeout
    if (_pendingPush.value) {
      clearTimeout(_pendingPush.value);
    }
    
    // Schedule push in 5 seconds
    _pendingPush.value = setTimeout(() => {
      if (_hasUnsyncedChanges.value && isConfigured.value && !isSyncing.value && isOnline.value) {
        performPush();
      }
    }, 5000);
  };

  // Perform push operation
  const performPush = async () => {
    if (!isConfigured.value) return;
    _status.value = "syncing";
    _message.value = "Auto-pushing changes…";
    try {
      const result = await pushToCloud(config.value as AzureCredentials);
      _status.value = "success";
      _message.value = `Auto-pushed ${result.exportedSessions} sessions, ${result.exportedTasks} tasks`;
      _lastPushedAt.value = new Date().toISOString();
      clearUnsyncedChanges();
      
      // Auto-pull after push if enabled
      if (syncSettings.value.autoPull && isConfigured.value) {
        scheduleAutoPull();
      }
    } catch (e: unknown) {
      _status.value = "error";
      _message.value = e instanceof Error ? e.message : "Auto-push failed";
    }
  };

  // Schedule auto-pull check
  const scheduleAutoPull = () => {
    // Clear existing interval
    if (_autoPullInterval.value) {
      clearTimeout(_autoPullInterval.value);
    }
    
    if (!syncSettings.value.autoPull || !isConfigured.value) return;
    
    const intervalMinutes = syncSettings.value.autoPullInterval;
    const intervalMs = intervalMinutes * 60 * 1000;
    
    const checkAndPull = async () => {
      if (!isConfigured.value || !isOnline.value) {
        scheduleAutoPull(); // Retry later
        return;
      }
      
      try {
        const info = await getSyncInfo(config.value as AzureCredentials);
        if (!info || !info.ok) {
          scheduleAutoPull();
          return;
        }
        
        // Check if cloud has newer data
        if (info.exportedAt && _lastPulledAt.value && info.exportedAt > _lastPulledAt.value) {
          // There's newer data in cloud
          _status.value = "warning";
          _message.value = `Cloud has ${info.sessionCount} sessions, ${info.taskCount} tasks (newer than local)`;
          
          // Auto-pull if we're in fully automatic mode
          // For now, just notify - user will need to manually confirm
          // In future, could auto-pull with merge
        }
        
        // Schedule next check
        scheduleAutoPull();
      } catch (e) {
        console.error("Auto-pull check failed:", e);
        scheduleAutoPull();
      }
    };
    
    // First check after interval, then recurring
    _autoPullInterval.value = setTimeout(checkAndPull, intervalMs);
  };

  // Start/stop auto-sync
  const startAutoSync = () => {
    if (!isConfigured.value) return;
    
    // Start auto-pull checking
    if (syncSettings.value.autoPull) {
      scheduleAutoPull();
    }
    
    // Mark online status
    _isOnline.value = navigator.onLine;
    window.addEventListener("online", () => {
      _isOnline.value = true;
      // Trigger sync when back online
      if (_hasUnsyncedChanges.value) {
        scheduleAutoPush();
      }
    });
    window.addEventListener("offline", () => {
      _isOnline.value = false;
    });
  };

  const stopAutoSync = () => {
    if (_pendingPush.value) {
      clearTimeout(_pendingPush.value);
      _pendingPush.value = null;
    }
    if (_autoPullInterval.value) {
      clearTimeout(_autoPullInterval.value);
      _autoPullInterval.value = null;
    }
  };

  // Watch for settings changes
  watch(() => syncSettings.value, (newSettings) => {
    _conflictStrategy.value = newSettings.conflictStrategy;
    
    // Restart auto-sync if enabled
    stopAutoSync();
    if (newSettings.autoPush || newSettings.autoPull) {
      startAutoSync();
    }
  }, { deep: true });

  // Push
  const push = async () => {
    if (!isConfigured.value) return;
    _status.value = "syncing";
    _message.value = "";
    try {
      const result = await pushToCloud(config.value as AzureCredentials);
      _status.value = "success";
      _message.value = `Pushed ${result.exportedSessions} sessions, ${result.exportedTasks} tasks`;
      _lastPushedAt.value = new Date().toISOString();
      clearUnsyncedChanges();
    } catch (e: unknown) {
      _status.value = "error";
      _message.value = e instanceof Error ? e.message : "Push failed";
    }
  };

  // Preview pull
  const previewPull = async () => {
    if (!isConfigured.value) return null;
    _status.value = "syncing";
    _message.value = "";
    try {
      const result = await previewPullFromCloud(config.value as AzureCredentials);
      _preview.value = {
        newSessions: result.newSessions,
        newTasks: result.newTasks,
        updatedSessions: result.updatedSessions,
        updatedTasks: result.updatedTasks,
        conflictCount: result.conflictCount,
      };
      _status.value = "idle";
      
      // Auto-show confirmation if there are conflicts or new items
      if (result.conflictCount > 0 || result.newSessions > 0 || result.newTasks > 0) {
        _showConfirmation.value = true;
      } else {
        _message.value = "Already up to date with cloud";
      }
      return result;
    } catch (e: unknown) {
      _status.value = "error";
      _message.value = e instanceof Error ? e.message : "Preview failed";
      _preview.value = null;
      return null;
    }
  };

  // Confirm pull
  const confirmPull = async (merge: boolean = true, strategy?: "keep_local" | "keep_cloud" | "keep_newer") => {
    _showConfirmation.value = false;
    _preview.value = null;
    
    if (!isConfigured.value) return;
    
    _status.value = "syncing";
    _message.value = "";
    
    const options: PullRequest = {
      merge,
      conflictStrategy: strategy || conflictStrategy.value,
    };
    
    try {
      const result = await pullFromCloud(config.value as AzureCredentials, options);
      const totalItems = (result.importedSessions || 0) + (result.importedTasks || 0) + 
                         (result.mergedSessions || 0) + (result.mergedTasks || 0);
      const conflictMsg = result.conflicts && result.conflicts > 0 ? ` (${result.conflicts} conflicts)` : "";
      
      _status.value = "success";
      _message.value = `Pulled ${totalItems} items${conflictMsg}. Reloading…`;
      _lastPulledAt.value = new Date().toISOString();
      
      // Reload the app so all composables re-fetch from the DB
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: unknown) {
      _status.value = "error";
      _message.value = e instanceof Error ? e.message : "Pull failed";
    }
  };

  // Pull
  const pull = async (merge: boolean = true, strategy?: "keep_local" | "keep_cloud" | "keep_newer") => {
    // Always preview first, then show confirmation if needed
    const previewResult = await previewPull();
    if (previewResult && previewResult.conflictCount === 0 && 
        previewResult.newSessions === 0 && previewResult.newTasks === 0) {
      // Nothing to pull, just show message
      _message.value = "Already up to date with cloud";
      _status.value = "success";
      return;
    }
    // Confirmation modal will be shown by previewPull if there are changes
  };

  // Cancel pull
  const cancelPull = () => {
    _showConfirmation.value = false;
    _preview.value = null;
    _status.value = "idle";
    _message.value = "Pull cancelled";
  };

  // Get sync info
  const getInfo = async (): Promise<SyncInfoResult | null> => {
    if (!isConfigured.value) return null;
    try {
      return await getSyncInfo(config.value as AzureCredentials);
    } catch (e: unknown) {
      console.error("Failed to get sync info:", e);
      return null;
    }
  };

  // Clear status
  const clearStatus = () => {
    _status.value = "idle";
    _message.value = "";
    _preview.value = null;
    _showConfirmation.value = false;
  };

  // Initialize
  if (isConfigured.value && (syncSettings.value.autoPush || syncSettings.value.autoPull)) {
    startAutoSync();
  }

  // Return public API
  return {
    // Config
    config,
    syncSettings,
    isConfigured,
    
    // State
    isSyncing,
    showConfirmation,
    preview,
    conflictStrategy,
    hasUnsyncedChanges,
    lastPushedAt,
    lastPulledAt,
    isOnline,
    syncState,
    status: _status,
    message: _message,
    
    // Settings
    setConflictStrategy,
    
    // Actions
    push,
    pull,
    previewPull,
    confirmPull,
    cancelPull,
    markUnsyncedChanges,
    clearUnsyncedChanges,
    getInfo,
    startAutoSync,
    stopAutoSync,
    clearStatus,
  };
}
