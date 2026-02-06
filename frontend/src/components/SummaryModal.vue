<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>Today's Summary</h2>
        <button class="modal-close" aria-label="Close" @click="$emit('close')">
          &times;
        </button>
      </div>
      <div class="modal-body">
        <div class="summary-stat">
          <span class="summary-value">{{ stats.focusCount }}</span>
          <span class="summary-label">Focus Sessions</span>
        </div>
        <div class="summary-stat">
          <span class="summary-value">{{ stats.totalFocusMinutes }}</span>
          <span class="summary-label">Minutes Focused</span>
        </div>
        <div class="summary-stat">
          <span class="summary-value">{{ stats.breakCount }}</span>
          <span class="summary-label">Breaks Taken</span>
        </div>
        <div v-if="stats.labelBreakdown.length > 0" class="summary-breakdown">
          <h3>By Label</h3>
          <ul>
            <li v-for="item in stats.labelBreakdown" :key="item.label">
              <span class="breakdown-label">{{ item.label }}</span>
              <span class="breakdown-count">{{ item.count }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface LabelBreakdown {
  label: string;
  count: number;
}

interface Stats {
  focusCount: number;
  totalFocusMinutes: number;
  breakCount: number;
  labelBreakdown: LabelBreakdown[];
}

defineProps<{
  stats: Stats;
}>();

defineEmits<{
  close: [];
}>();
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
  max-width: 400px;
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

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  margin-bottom: 1rem;
  background: var(--bg-subtle);
  border-radius: 8px;
}

.summary-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
}

.summary-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.summary-breakdown {
  margin-top: 1rem;
}

.summary-breakdown h3 {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-breakdown ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.summary-breakdown li {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.summary-breakdown li:last-child {
  border-bottom: none;
}

.breakdown-label {
  color: var(--text-primary);
}

.breakdown-count {
  color: var(--text-secondary);
  font-weight: 600;
}
</style>
