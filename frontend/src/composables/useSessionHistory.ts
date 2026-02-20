import { computed, ref } from "vue";
import type { SessionType } from "./useTimer";
import * as sessionsApi from "../api/sessions";

export interface SessionHistoryEntry {
  id: string;
  type: SessionType;
  label: string;
  startedAt: number; // timestamp ms
  completedAt: number; // timestamp ms
  duration: number; // seconds
}

export interface SessionHistory {
  entries: SessionHistoryEntry[];
  lastCleared: number; // timestamp ms
}

const MAX_ENTRIES = 500;

// ---------------------------------------------------------------------------
// Module-level singleton state (shared across all useSessionHistory() calls)
// ---------------------------------------------------------------------------
const _entries = ref<SessionHistoryEntry[]>([]);
const _lastCleared = ref<number>(Date.now());
const _loaded = ref(false);

/** Re-fetch all sessions from the backend. Called on init and after a pull. */
export async function refreshSessions(): Promise<void> {
  try {
    const data = await sessionsApi.fetchSessions();
    _entries.value = data;
  } catch (e) {
    console.error("[useSessionHistory] Failed to load sessions:", e);
  } finally {
    _loaded.value = true;
  }
}

export function useSessionHistory() {
  // Trigger a background load on first use
  if (!_loaded.value) {
    refreshSessions();
  }

  // Computed view of the full history (read-only compatible with old interface)
  const history = computed<SessionHistory>(() => ({
    entries: _entries.value,
    lastCleared: _lastCleared.value,
  }));

  // Get today's entries only
  const todayEntries = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    return _entries.value.filter((e) => e.completedAt >= todayStart);
  });

  // Get this week's entries (Monday-based)
  const weekEntries = computed(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.getTime();
    return _entries.value.filter((e) => e.completedAt >= weekStart);
  });

  // Get this month's entries
  const monthEntries = computed(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return _entries.value.filter((e) => e.completedAt >= monthStart);
  });

  // Today's stats
  const todayStats = computed(() => {
    const entries = todayEntries.value;
    const focusSessions = entries.filter((e) => e.type === "focus");
    const breakSessions = entries.filter((e) => e.type !== "focus");
    const totalFocusTime = focusSessions.reduce(
      (sum, e) => sum + e.duration,
      0,
    );

    const labelCounts = new Map<string, number>();
    focusSessions.forEach((e) => {
      const label = e.label || "Unlabeled";
      labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
    });

    return {
      focusCount: focusSessions.length,
      breakCount: breakSessions.length,
      totalFocusMinutes: Math.round(totalFocusTime / 60),
      labelBreakdown: Array.from(labelCounts.entries()).map(
        ([label, count]) => ({
          label,
          count,
        }),
      ),
    };
  });

  /** Record a completed session. Updates local state immediately, POSTs to API in background. */
  const recordSession = (
    type: SessionType,
    label: string,
    duration: number,
    startedAt: number,
  ) => {
    const entry: SessionHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      label: label.trim(),
      startedAt,
      completedAt: Date.now(),
      duration,
    };

    // Optimistic update
    _entries.value = [entry, ..._entries.value].slice(0, MAX_ENTRIES);

    // Fire-and-forget to backend
    sessionsApi
      .postSession(entry)
      .catch((e) =>
        console.error("[useSessionHistory] Failed to persist session:", e),
      );

    return entry;
  };

  /** Clear all history. Updates local state immediately, DELETEs on backend in background. */
  const clearHistory = () => {
    _entries.value = [];
    _lastCleared.value = Date.now();
    sessionsApi
      .deleteAllSessions()
      .catch((e) =>
        console.error("[useSessionHistory] Failed to delete sessions:", e),
      );
  };

  // Get unique labels used (for autocomplete presets)
  const recentLabels = computed(() => {
    const labels = new Set<string>();
    _entries.value.forEach((e) => {
      if (e.label && e.label.trim()) labels.add(e.label);
    });
    return Array.from(labels).slice(0, 10);
  });

  return {
    history,
    todayEntries,
    weekEntries,
    monthEntries,
    todayStats,
    recordSession,
    clearHistory,
    recentLabels,
  };
}
