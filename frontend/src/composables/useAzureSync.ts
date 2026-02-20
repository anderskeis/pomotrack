import { computed, ref } from "vue";
import { useStorage } from "./useStorage";
import { pushToCloud, pullFromCloud, type AzureCredentials } from "../api/sync";

export interface AzureConfig {
  accountName: string;
  containerName: string;
  accountKey: string;
}

const defaultConfig: AzureConfig = {
  accountName: "",
  containerName: "",
  accountKey: "",
};

export type SyncStatus = "idle" | "syncing" | "success" | "error";

// Singleton state – shared across all useAzureSync() calls
const _status = ref<SyncStatus>("idle");
const _message = ref("");

export function useAzureSync() {
  const config = useStorage<AzureConfig>("azure-config", defaultConfig);

  const isConfigured = computed(
    () =>
      !!(
        config.value.accountName.trim() &&
        config.value.containerName.trim() &&
        config.value.accountKey.trim()
      ),
  );

  const isSyncing = computed(() => _status.value === "syncing");

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

  const pull = async () => {
    if (!isConfigured.value) return;
    _status.value = "syncing";
    _message.value = "";
    try {
      const result = await pullFromCloud(config.value as AzureCredentials);
      _status.value = "success";
      _message.value = `Pulled ${result.importedSessions} sessions, ${result.importedTasks} tasks. Reloading…`;
      // Reload the app so all composables re-fetch from the DB
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: unknown) {
      _status.value = "error";
      _message.value = e instanceof Error ? e.message : "Pull failed";
    }
  };

  const clearStatus = () => {
    _status.value = "idle";
    _message.value = "";
  };

  return {
    config,
    isConfigured,
    isSyncing,
    status: _status,
    message: _message,
    push,
    pull,
    clearStatus,
  };
}
