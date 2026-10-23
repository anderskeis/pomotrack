<template>
  <div class="kanban-panel">
    <h3 class="panel-title">Tasks</h3>

    <!-- Add Task Input -->
    <div class="add-task">
      <input
        v-model="newTaskTitle"
        @keyup.enter="handleAddTask"
        type="text"
        placeholder="Add a task..."
        maxlength="50"
        class="input task-input"
      />
      <button
        @click="handleAddTask"
        class="btn btn-add"
        :disabled="!newTaskTitle.trim()"
      >
        +
      </button>
    </div>

    <!-- Kanban Columns -->
    <div class="kanban-columns">
      <!-- Todo Column -->
      <div
        class="kanban-column"
        @dragover.prevent
        @drop="handleDrop($event, 'todo')"
      >
        <div class="column-header">
          <span class="column-title">To Do</span>
          <span class="column-count">{{ todoTasks.length }}</span>
        </div>
        <div class="column-tasks">
          <div
            v-for="task in todoTasks"
            :key="task.id"
            class="task-card task-todo"
            draggable="true"
            @dragstart="handleDragStart($event, task)"
            @dragend="handleDragEnd"
          >
            <span class="task-title" :title="task.title">{{ task.title }}</span>
            <div class="task-actions">
              <button
                type="button"
                class="btn-action btn-start-task"
                @click="moveTask(task.id, 'in-progress')"
                title="Start task (Move to In Progress)"
                aria-label="Move task to In Progress"
              >
                ▶
              </button>
              <button
                type="button"
                class="btn-action btn-delete"
                @click="deleteTask(task.id)"
                title="Delete task"
                aria-label="Delete task"
              >
                ×
              </button>
            </div>
          </div>
          <div v-if="todoTasks.length === 0" class="column-empty">No tasks</div>
        </div>
      </div>

      <!-- In Progress Column -->
      <div
        class="kanban-column column-active"
        @dragover.prevent
        @drop="handleDrop($event, 'in-progress')"
      >
        <div class="column-header">
          <span class="column-title">In Progress</span>
          <span class="column-count">{{ inProgressTasks.length }}</span>
        </div>
        <div class="column-tasks">
          <div
            v-for="task in inProgressTasks"
            :key="task.id"
            class="task-card task-active"
            :class="{ 'is-primary-active': activeTask?.id === task.id }"
            draggable="true"
            @dragstart="handleDragStart($event, task)"
            @dragend="handleDragEnd"
          >
            <span
              v-if="activeTask?.id === task.id"
              class="active-badge"
              title="Active task receiving Pomodoro focus counts"
            >
              🎯 Active
            </span>
            <span class="task-title" :title="task.title">{{ task.title }}</span>
            <div class="task-meta">
              <span class="task-pomodoros" v-if="task.pomodorosCompleted > 0">
                {{ task.pomodorosCompleted }} 🍅
              </span>
            </div>
            <div class="task-actions">
              <button
                type="button"
                class="btn-action"
                @click="moveTask(task.id, 'todo')"
                title="Move back to To Do"
                aria-label="Move task back to To Do"
              >
                ↩
              </button>
              <button
                type="button"
                class="btn-action btn-complete-task"
                @click="moveTask(task.id, 'done')"
                title="Mark as Done"
                aria-label="Mark task as Done"
              >
                ✓
              </button>
              <button
                type="button"
                class="btn-action btn-delete"
                @click="deleteTask(task.id)"
                title="Delete task"
                aria-label="Delete task"
              >
                ×
              </button>
            </div>
          </div>
          <div v-if="inProgressTasks.length === 0" class="column-empty">
            Drag or click ▶ on a task to start
          </div>
        </div>
      </div>

      <!-- Done Column -->
      <div
        class="kanban-column column-done"
        @dragover.prevent
        @drop="handleDrop($event, 'done')"
      >
        <div class="column-header">
          <span class="column-title">Done</span>
          <span class="column-count">{{ doneTasks.length }}</span>
          <button
            v-if="doneTasks.length > 0"
            type="button"
            class="btn-clear"
            @click="clearDoneTasks"
            title="Clear done tasks"
            aria-label="Clear done tasks"
          >
            🗑️
          </button>
        </div>
        <div class="column-tasks">
          <div
            v-for="task in doneTasks"
            :key="task.id"
            class="task-card task-done"
            draggable="true"
            @dragstart="handleDragStart($event, task)"
            @dragend="handleDragEnd"
          >
            <span class="task-title" :title="task.title">{{ task.title }}</span>
            <span class="task-pomodoros" v-if="task.pomodorosCompleted > 0">
              {{ task.pomodorosCompleted }} 🍅
            </span>
            <div class="task-actions">
              <button
                type="button"
                class="btn-action"
                @click="moveTask(task.id, 'in-progress')"
                title="Reopen task (Move to In Progress)"
                aria-label="Reopen task"
              >
                ↩
              </button>
              <button
                type="button"
                class="btn-action btn-delete"
                @click="deleteTask(task.id)"
                title="Delete task"
                aria-label="Delete task"
              >
                ×
              </button>
            </div>
          </div>
          <div v-if="doneTasks.length === 0" class="column-empty">
            Completed tasks
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  useKanban,
  type KanbanTask,
  type KanbanStatus,
} from "../composables/useKanban";

const {
  todoTasks,
  inProgressTasks,
  doneTasks,
  activeTask,
  addTask,
  moveTask,
  deleteTask,
  clearDoneTasks,
} = useKanban();

const newTaskTitle = ref("");
const draggedTask = ref<KanbanTask | null>(null);

const handleAddTask = () => {
  if (newTaskTitle.value.trim()) {
    addTask(newTaskTitle.value);
    newTaskTitle.value = "";
  }
};

const handleDragStart = (event: DragEvent, task: KanbanTask) => {
  draggedTask.value = task;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", task.id);
  }
  // Add dragging class after a tick to allow the drag image to be captured
  setTimeout(() => {
    const target = event.target as HTMLElement;
    target.classList.add("dragging");
  }, 0);
};

const handleDragEnd = (event: DragEvent) => {
  const target = event.target as HTMLElement;
  target.classList.remove("dragging");
  draggedTask.value = null;
};

const handleDrop = (event: DragEvent, status: KanbanStatus) => {
  event.preventDefault();
  if (draggedTask.value) {
    moveTask(draggedTask.value.id, status);
    draggedTask.value = null;
  }
};
</script>

<style scoped>
.kanban-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.panel-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin: 0;
}

.add-task {
  display: flex;
  gap: 0.5rem;
}

.task-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
}

.task-input::placeholder {
  color: var(--text-muted);
}

.task-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.btn-add {
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  background: var(--color-primary);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn-add:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.kanban-columns {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.kanban-column {
  background: var(--bg-subtle);
  border-radius: 6px;
  padding: 0.5rem;
  min-height: 60px;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0 0.25rem;
}

.column-title {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.column-count {
  font-size: 0.625rem;
  font-weight: 600;
  background: var(--bg-input);
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  color: var(--text-muted);
}

.btn-clear {
  margin-left: auto;
  padding: 0.125rem 0.25rem;
  font-size: 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.15s ease;
}

.btn-clear:hover {
  opacity: 1;
}

.column-tasks {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-height: 30px;
  max-height: 160px;
  overflow-y: auto;
}

.column-empty {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
  padding: 0.5rem;
  font-style: italic;
}

.task-card {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.625rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: grab;
  transition: all 0.15s ease;
}

.task-card:hover {
  border-color: var(--text-muted);
}

.task-card.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

/* Todo tasks - neutral/gray tint */
.task-card.task-todo {
  background: rgba(148, 163, 184, 0.1);
  border-color: rgba(148, 163, 184, 0.3);
}

.task-card.task-todo:hover {
  border-color: rgba(148, 163, 184, 0.5);
}

/* In Progress tasks - primary red/tomato tint */
.task-card.task-active {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
}

.task-card.task-active.is-primary-active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary-shadow);
}

.task-card.task-active:hover {
  border-color: var(--color-primary);
}

.active-badge {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: var(--color-primary);
  color: #ffffff;
  padding: 0.1rem 0.375rem;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Done tasks - secondary indigo/purple tint */
.task-card.task-done {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.3);
}

.task-card.task-done .task-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.task-title {
  flex: 1;
  min-width: 0;
  font-size: 0.8125rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.task-pomodoros {
  font-size: 0.6875rem;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.task-card:hover .task-actions,
.task-card:focus-within .task-actions {
  opacity: 1;
}

@media (hover: none) {
  .task-actions {
    opacity: 1;
  }
}

.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: 20px;
  height: 20px;
  font-size: 0.75rem;
  line-height: 1;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-action:hover {
  background: var(--bg-input);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.btn-start-task:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-complete-task:hover {
  color: var(--color-short-break);
  border-color: var(--color-short-break);
}

.btn-delete {
  font-size: 0.95rem;
}

.btn-delete:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--bg-input);
}

/* Column accent colors */
.column-active {
  border-left: 2px solid var(--color-primary);
}

.column-done {
  border-left: 2px solid var(--color-secondary);
}

/* Compact mode */
.compact-mode .kanban-panel {
  padding: 0.75rem;
}

.compact-mode .kanban-columns {
  gap: 0.5rem;
}

.compact-mode .kanban-column {
  padding: 0.375rem;
}

.compact-mode .column-tasks {
  gap: 0.25rem;
  max-height: 120px;
}

.compact-mode .task-card {
  padding: 0.3rem 0.5rem;
}
</style>
