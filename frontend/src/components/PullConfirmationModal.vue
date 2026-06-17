<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="modal-overlay"
      @click.self="onCancel"
    >
      <div class="modal pull-confirmation-modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2>☁️ Confirm Cloud Pull</h2>
          <button
            class="modal-close"
            aria-label="Close"
            @click="onCancel"
          >
            &times;
          </button>
        </div>
        <div class="modal-body">
          <p class="summary">
            Cloud has data that will be merged with your local data:
          </p>
          
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-value">{{ preview?.newSessions || 0 }}</span>
              <span class="stat-label">New sessions</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ preview?.newTasks || 0 }}</span>
              <span class="stat-label">New tasks</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ preview?.updatedSessions || 0 }}</span>
              <span class="stat-label">Updated sessions</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ preview?.updatedTasks || 0 }}</span>
              <span class="stat-label">Updated tasks</span>
            </div>
          </div>

          <div v-if="preview?.conflictCount && preview.conflictCount > 0" class="conflict-section">
            <div class="conflict-warning">
              <span class="warning-icon">⚠️</span>
              <span>{{ preview.conflictCount }} conflicts detected</span>
            </div>
            <p class="conflict-explanation">
              Some items exist both locally and in cloud with different data.
            </p>
            <div class="conflict-strategy">
              <label>Conflict resolution:</label>
              <select v-model="selectedStrategy" class="strategy-select">
                <option value="keep_local">Keep my local data</option>
                <option value="keep_cloud">Use cloud data</option>
                <option value="keep_newer">Keep the newer version</option>
              </select>
            </div>
          </div>

          <p class="note">
            Your local data will be preserved. Only new items and updates from cloud will be added.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="onCancel">
            Cancel
          </button>
          <button class="btn btn-primary" @click="onConfirm">
            Merge Data
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { PullPreview } from "../composables/useAzureSync";

interface Props {
  visible: boolean;
  preview: PullPreview | null;
  conflictStrategy: "keep_local" | "keep_cloud" | "keep_newer";
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "confirm", strategy: "keep_local" | "keep_cloud" | "keep_newer"): void;
  (e: "cancel"): void;
}>();

const selectedStrategy = ref<"keep_local" | "keep_cloud" | "keep_newer">(props.conflictStrategy);

// Update selected strategy when prop changes
watch(() => props.conflictStrategy, (newVal) => {
  selectedStrategy.value = newVal;
});

const onConfirm = () => {
  emit("confirm", selectedStrategy.value);
};

const onCancel = () => {
  emit("cancel");
};
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
  max-width: 500px;
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
}

.summary {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: var(--bg-subtle);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-color);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.conflict-section {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--bg-warning);
  border-radius: 8px;
  border: 1px solid var(--border-warning);
}

.conflict-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text-warning);
  margin-bottom: 0.5rem;
}

.conflict-explanation {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.conflict-strategy {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.conflict-strategy label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.strategy-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
}

.strategy-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

.note {
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: var(--text-muted);
  font-style: italic;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--accent-color);
  color: var(--accent-text);
  border: none;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-secondary {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-subtle);
  color: var(--text-primary);
}
</style>
