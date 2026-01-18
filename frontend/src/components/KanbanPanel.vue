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
            class="task-card"
            draggable="true"
            @dragstart="handleDragStart($event, task)"
            @dragend="handleDragEnd"
          >
            <span class="task-title">{{ task.title }}</span>
            <button
              class="btn-delete"
              @click="deleteTask(task.id)"
              title="Delete task"
            >
              ×
            </button>
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
            draggable="true"
            @dragstart="handleDragStart($event, task)"
            @dragend="handleDragEnd"
          >
            <span class="task-title">{{ task.title }}</span>
            <div class="task-meta">
              <span class="task-pomodoros" v-if="task.pomodorosCompleted > 0">
                {{ task.pomodorosCompleted }} 🍅
              </span>
            </div>
            <button
              class="btn-delete"
              @click="deleteTask(task.id)"
              title="Delete task"
            >
              ×
            </button>
          </div>
          <div v-if="inProgressTasks.length === 0" class="column-empty">
            Drag a task here
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
            class="btn-clear"
            @click="clearDoneTasks"
            title="Clear done tasks"
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
            <span class="task-title">{{ task.title }}</span>
            <span class="task-pomodoros" v-if="task.pomodorosCompleted > 0">
              {{ task.pomodorosCompleted }} 🍅
            </span>
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
  gap: 0.5rem;
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

.task-card.task-active {
  border-color: var(--color-primary);
  background: var(--bg-secondary);
}

.task-card.task-done {
  opacity: 0.7;
}

.task-card.task-done .task-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.task-title {
  flex: 1;
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
}

.task-pomodoros {
  font-size: 0.6875rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.btn-delete {
  padding: 0;
  width: 18px;
  height: 18px;
  font-size: 1rem;
  line-height: 1;
  background: transparent;
  border: none;
  border-radius: 2px;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s ease;
}

.task-card:hover .btn-delete {
  opacity: 1;
}

.btn-delete:hover {
  color: var(--color-primary);
  background: var(--bg-input);
}

/* Column accent colors */
.column-active {
  border-left: 2px solid var(--color-primary);
}

.column-done {
  border-left: 2px solid var(--color-secondary);
}
</style>
