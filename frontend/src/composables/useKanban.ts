import { computed, ref } from "vue";
import * as kanbanApi from "../api/kanban";

export type KanbanStatus = "todo" | "in-progress" | "done";

export interface KanbanTask {
  id: string;
  title: string;
  status: KanbanStatus;
  pomodorosCompleted: number;
  createdAt: number;
  completedAt?: number;
}

export interface KanbanState {
  tasks: KanbanTask[];
}

// ---------------------------------------------------------------------------
// Module-level singleton state
// ---------------------------------------------------------------------------
const _tasks = ref<KanbanTask[]>([]);
const _loaded = ref(false);

/** Re-fetch all tasks from the backend. Called on init and after a pull. */
export async function refreshTasks(): Promise<void> {
  try {
    const data = await kanbanApi.fetchTasks();
    _tasks.value = data;
  } catch (e) {
    console.error("[useKanban] Failed to load tasks:", e);
  } finally {
    _loaded.value = true;
  }
}

export function useKanban() {
  if (!_loaded.value) {
    refreshTasks();
  }

  const todoTasks = computed(() =>
    _tasks.value.filter((t) => t.status === "todo"),
  );
  const inProgressTasks = computed(() =>
    _tasks.value.filter((t) => t.status === "in-progress"),
  );
  const doneTasks = computed(() =>
    _tasks.value.filter((t) => t.status === "done"),
  );
  const activeTask = computed(
    () => _tasks.value.find((t) => t.status === "in-progress") || null,
  );

  const generateId = () =>
    `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const addTask = (title: string) => {
    if (!title.trim()) return;

    const newTask: KanbanTask = {
      id: generateId(),
      title: title.trim(),
      status: "todo",
      pomodorosCompleted: 0,
      createdAt: Date.now(),
    };

    _tasks.value = [..._tasks.value, newTask];
    kanbanApi
      .createTask(newTask)
      .catch((e) => console.error("[useKanban] Failed to create task:", e));
  };

  const moveTask = (taskId: string, newStatus: KanbanStatus) => {
    const task = _tasks.value.find((t) => t.id === taskId);
    if (!task) return;

    const updated: KanbanTask[] = _tasks.value.map((t) => {
      // Bump existing in-progress back to todo
      if (
        newStatus === "in-progress" &&
        t.status === "in-progress" &&
        t.id !== taskId
      ) {
        const reverted = {
          ...t,
          status: "todo" as KanbanStatus,
          completedAt: undefined,
        };
        kanbanApi
          .updateTask(reverted)
          .catch((e) => console.error("[useKanban] Failed to update task:", e));
        return reverted;
      }
      if (t.id === taskId) {
        const moved: KanbanTask = {
          ...t,
          status: newStatus,
          completedAt: newStatus === "done" ? Date.now() : undefined,
        };
        kanbanApi
          .updateTask(moved)
          .catch((e) => console.error("[useKanban] Failed to update task:", e));
        return moved;
      }
      return t;
    });

    _tasks.value = updated;
  };

  const deleteTask = (taskId: string) => {
    _tasks.value = _tasks.value.filter((t) => t.id !== taskId);
    kanbanApi
      .deleteTask(taskId)
      .catch((e) => console.error("[useKanban] Failed to delete task:", e));
  };

  const incrementActiveTaskPomodoros = () => {
    const task = _tasks.value.find((t) => t.status === "in-progress");
    if (!task) return;
    const updated = {
      ...task,
      pomodorosCompleted: task.pomodorosCompleted + 1,
    };
    _tasks.value = _tasks.value.map((t) => (t.id === task.id ? updated : t));
    kanbanApi
      .updateTask(updated)
      .catch((e) =>
        console.error("[useKanban] Failed to increment pomodoros:", e),
      );
  };

  const clearDoneTasks = () => {
    const toDelete = _tasks.value.filter((t) => t.status === "done");
    _tasks.value = _tasks.value.filter((t) => t.status !== "done");
    toDelete.forEach((t) =>
      kanbanApi
        .deleteTask(t.id)
        .catch((e) =>
          console.error("[useKanban] Failed to delete done task:", e),
        ),
    );
  };

  const clearAllTasks = () => {
    _tasks.value = [];
    kanbanApi
      .deleteAllTasks()
      .catch((e) => console.error("[useKanban] Failed to clear tasks:", e));
  };

  return {
    tasks: computed(() => _tasks.value),
    todoTasks,
    inProgressTasks,
    doneTasks,
    activeTask,
    addTask,
    moveTask,
    deleteTask,
    incrementActiveTaskPomodoros,
    clearDoneTasks,
    clearAllTasks,
  };
}
