import { computed, ref } from "vue";
import { useStorage } from "./useStorage";
import {
  pushToCloud,
  pullFromCloud,
  previewPullFromCloud,
  type AzureCredentials,
  type PullRequest,
} from "../api/sync";

export interface AzureConfig {
  accountName: string;
  containerName: string;
  accountKey: string;
}

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export interface PullPreview {
  newSessions: number;
  newTasks: number;
  updatedSessions: number;
  updatedTasks: number;
  conflictCount: number;
}

// Singleton state – shared across all useAzureSync() calls
const _status = ref<SyncStatus>("idle");
const _message = ref("");
const _preview = ref<PullPreview | null>(null);
const _showConfirmation = ref(false);
const _conflictStrategy = ref<"keep_local" | "keep_cloud" | "keep_newer">("keep_local");

export function useAzureSync() {
  const config = useStorage<AzureConfig>("azure-config", {
    accountName: "",
    containerName: "",
    accountKey: "",
  });

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
  const conflictStrategy = computed(() => _conflictStrategy.value);

  const setConflictStrategy = (strategy: "keep_local" | "keep_cloud" | "keep_newer") => {
    _conflictStrategy.value = strategy;
  };

  const push = async () => {
    if (!isConfigured.value) return;
    _status.value = "syncing";
    _message.value = "";
    try {
      const result = await pushToCloud(config.value as AzureCredentials);
      _status.value = "success";
      _message.value = `Pushed ${result.exportedSessions} sessions, ${result.exportedTasks} tasks`;
    } catch (e: unknown) {
      _status.value = "error";
      _message.value = e instanceof Error ? e.message : "Push failed";
    }
  };

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
      
      // Auto-show confirmation if there are changes
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

  const confirmPull = async (merge: boolean = true, strategy?: "keep_local" | "keep_cloud" | "keep_newer") => {
    _showConfirmation.value = false;
    _preview.value = null;
    
    if (!isConfigured.value) return;
    
    _status.value = "syncing";
    _message.value = "";
    
    const options: PullRequest = {
      merge,
      conflictStrategy: strategy || _conflictStrategy.value,
    };
    
    try {
      const result = await pullFromCloud(config.value as AzureCredentials, options);
      const totalItems = (result.importedSessions || 0) + (result.importedTasks || 0) + 
                         (result.mergedSessions || 0) + (result.mergedTasks || 0);
      const conflictMsg = result.conflicts && result.conflicts > 0 ? ` (${result.conflicts} conflicts)` : "";
      
      _status.value = "success";
      _message.value = `Pulled ${totalItems} items${conflictMsg}. Reloading…`;
      
      // Reload the app so all composables re-fetch from the DB
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: unknown) {
      _status.value = "error";
      _message.value = e instanceof Error ? e.message : "Pull failed";
    }
  };

  const pull = async () => {
    // Always preview first
    const previewResult = await previewPull();
    if (previewResult && previewResult.conflictCount === 0 && 
        previewResult.newSessions === 0 && previewResult.newTasks === 0) {
      _message.value = "Already up to date with cloud";
      _status.value = "success";
      return;
    }
    // Confirmation modal will be shown by previewPull if there are changes
  };

  const cancelPull = () => {
    _showConfirmation.value = false;
    _preview.value = null;
    _status.value = "idle";
    _message.value = "Pull cancelled";
  };

  const clearStatus = () => {
    _status.value = "idle";
    _message.value = "";
    _preview.value = null;
    _showConfirmation.value = false;
  };

  return {
    config,
    isConfigured,
    isSyncing,
    showConfirmation,
    preview,
    conflictStrategy,
    setConflictStrategy,
    status: _status,
    message: _message,
    push,
    pull,
    previewPull,
    confirmPull,
    cancelPull,
    clearStatus,
  };
}
