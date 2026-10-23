<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ modalTitle }}</h2>
        <button class="modal-close" aria-label="Close" @click="$emit('close')">
          &times;
        </button>
      </div>
      <div class="modal-body">
        <!-- Tab Selector -->
        <div class="modal-tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'today' }"
            @click="activeTab = 'today'"
          >
            Today
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'week' }"
            @click="activeTab = 'week'"
          >
            This Week
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'month' }"
            @click="activeTab = 'month'"
          >
            This Month
          </button>
        </div>

        <!-- 3-up Stats Grid -->
        <div class="summary-stats-grid">
          <div class="summary-stat">
            <span class="summary-value">{{ currentStats.focusCount }}</span>
            <span class="summary-label">Focus Sessions</span>
          </div>
          <div class="summary-stat">
            <span class="summary-value">{{ currentStats.totalFocusMinutes }}</span>
            <span class="summary-label">Minutes Focused</span>
          </div>
          <div class="summary-stat">
            <span class="summary-value">{{ currentStats.breakCount }}</span>
            <span class="summary-label">Breaks Taken</span>
          </div>
        </div>

        <!-- Label Breakdown -->
        <div v-if="currentStats.labelBreakdown.length > 0" class="summary-breakdown">
          <h3>By Label</h3>
          <ul class="breakdown-list">
            <li v-for="item in currentStats.labelBreakdown" :key="item.label" class="breakdown-item">
              <div class="breakdown-row">
                <span class="breakdown-label" :title="item.label">{{ item.label }}</span>
                <span class="breakdown-meta">
                  <strong class="breakdown-count">{{ item.count }} 🍅</strong>
                  <span class="breakdown-detail">
                    {{ formatMinutes(item.minutes) }} · {{ item.percent }}%
                  </span>
                </span>
              </div>
              <div
                class="breakdown-bar"
                role="progressbar"
                :aria-valuenow="item.percent"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="`${item.label}: ${item.percent}% of focus time`"
              >
                <div
                  class="breakdown-bar-fill"
                  :style="{ width: `${Math.max(item.percent, 4)}%` }"
                ></div>
              </div>
            </li>
          </ul>
        </div>
        <div v-else class="summary-empty">
          <p>No focus sessions recorded for this period.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { SessionHistoryEntry } from "../composables";

const props = defineProps<{
  todayEntries: SessionHistoryEntry[];
  weekEntries: SessionHistoryEntry[];
  monthEntries: SessionHistoryEntry[];
}>();

defineEmits<{
  close: [];
}>();

const activeTab = ref<"today" | "week" | "month">("today");

const modalTitle = computed(() => {
  switch (activeTab.value) {
    case "today":
      return "Today's Summary";
    case "week":
      return "Weekly Summary";
    case "month":
      return "Monthly Summary";
  }
});

const formatMinutes = (mins: number) => {
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
};

const calculateStats = (entries: SessionHistoryEntry[]) => {
  const focusSessions = entries.filter((e) => e.type === "focus");
  const breakSessions = entries.filter((e) => e.type !== "focus");
  const totalFocusTime = focusSessions.reduce(
    (sum, e) => sum + e.duration,
    0,
  );

  const labelMap = new Map<string, { count: number; duration: number }>();
  focusSessions.forEach((e) => {
    const label = e.label || "Unlabeled";
    const prev = labelMap.get(label) || { count: 0, duration: 0 };
    labelMap.set(label, {
      count: prev.count + 1,
      duration: prev.duration + e.duration,
    });
  });

  return {
    focusCount: focusSessions.length,
    breakCount: breakSessions.length,
    totalFocusMinutes: Math.round(totalFocusTime / 60),
    labelBreakdown: Array.from(labelMap.entries())
      .map(([label, data]) => {
        const percent =
          totalFocusTime > 0
            ? Math.round((data.duration / totalFocusTime) * 100)
            : focusSessions.length > 0
              ? Math.round((data.count / focusSessions.length) * 100)
              : 0;
        return {
          label,
          count: data.count,
          minutes: Math.round(data.duration / 60),
          percent,
        };
      })
      .sort((a, b) => b.count - a.count || b.minutes - a.minutes),
  };
};

const currentStats = computed(() => {
  const entries =
    activeTab.value === "today"
      ? props.todayEntries
      : activeTab.value === "week"
        ? props.weekEntries
        : props.monthEntries;
  return calculateStats(entries ?? []);
});
</script>

<style scoped>
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
  max-width: 440px;
  max-height: 80vh;
  overflow: auto;
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

/* Tabs styles */
.modal-tabs {
  display: flex;
  background: var(--bg-primary);
  padding: 0.25rem;
  border-radius: 8px;
  margin-bottom: 1.25rem;
  border: 1px solid var(--border-color);
}

.tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--panel-bg);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

/* Stats grid */
.summary-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 0.5rem;
  background: var(--bg-subtle);
  border-radius: 8px;
  text-align: center;
}

.summary-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1.1;
}

.summary-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.summary-breakdown {
  margin-top: 1rem;
}

.summary-breakdown h3 {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.breakdown-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.breakdown-item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
}

.breakdown-label {
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breakdown-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  font-size: 0.8125rem;
}

.breakdown-count {
  color: var(--text-primary);
  font-weight: 600;
}

.breakdown-detail {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.breakdown-bar {
  width: 100%;
  height: 6px;
  background: var(--bg-subtle);
  border-radius: 999px;
  overflow: hidden;
}

.breakdown-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.summary-empty {
  text-align: center;
  padding: 2rem 0;
  color: var(--text-muted);
  font-size: 0.875rem;
}
</style>
