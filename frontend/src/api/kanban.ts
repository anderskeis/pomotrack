import type { KanbanTask } from "../composables/useKanban";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${path}: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchTasks(): Promise<KanbanTask[]> {
  return request<KanbanTask[]>("/kanban/tasks");
}

export async function createTask(task: KanbanTask): Promise<KanbanTask> {
  return request<KanbanTask>("/kanban/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
}

export async function updateTask(task: KanbanTask): Promise<KanbanTask> {
  return request<KanbanTask>(`/kanban/tasks/${task.id}`, {
    method: "PUT",
    body: JSON.stringify(task),
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  await request(`/kanban/tasks/${taskId}`, { method: "DELETE" });
}

export async function deleteAllTasks(): Promise<void> {
  await request("/kanban/tasks", { method: "DELETE" });
}
