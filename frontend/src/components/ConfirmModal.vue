<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="modal-overlay"
      @click.self="emit('cancel')"
    >
      <div
        class="modal confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div class="modal-header">
          <h2 id="confirm-modal-title">{{ title }}</h2>
          <button
            class="modal-close"
            aria-label="Close"
            @click="emit('cancel')"
          >
            &times;
          </button>
        </div>
        <div class="modal-body">
          <p class="confirm-message">{{ message }}</p>
          <p v-if="warning" class="confirm-warning">{{ warning }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="emit('cancel')">
            {{ cancelLabel }}
          </button>
          <button
            class="btn"
            :class="danger ? 'btn-danger' : 'btn-primary'"
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean;
  title: string;
  message: string;
  warning?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

withDefaults(defineProps<Props>(), {
  warning: "",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  danger: false,
});

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
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
}

.confirm-message {
  margin-top: 0;
  color: var(--text-primary);
  line-height: 1.5;
}

.confirm-warning {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-urgency-warning, #f59e0b);
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
  border: none;
}

.btn-primary {
  background: var(--color-secondary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-secondary-hover);
}

.btn-danger {
  background: var(--color-primary);
  color: white;
}

.btn-danger:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 12px var(--color-primary-shadow);
}

.btn-secondary {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--bg-subtle);
  color: var(--text-primary);
}
</style>
