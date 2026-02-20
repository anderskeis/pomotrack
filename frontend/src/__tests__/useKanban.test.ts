import { describe, it, expect, beforeEach, vi } from "vitest";

let useKanban: typeof import("../composables/useKanban").useKanban;

// Mock fetch — GET returns [], mutations return ok/created object
const mockFetch = vi
  .fn()
  .mockImplementation((_url: string, options?: RequestInit) => {
    const method = options?.method ?? "GET";
    if (method === "GET") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }
    // For POST (create) return the body back so the response doesn't break callers
    const body = options?.body
      ? JSON.parse(options.body as string)
      : { ok: true };
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
  });

vi.stubGlobal("fetch", mockFetch);

describe("useKanban", () => {
  beforeEach(async () => {
    mockFetch.mockClear();
    vi.resetModules();
    const mod = await import("../composables/useKanban");
    useKanban = mod.useKanban;
  });

  it("starts with empty tasks", () => {
    const { tasks } = useKanban();
    expect(tasks.value).toEqual([]);
  });

  it("adds a task to todo", () => {
    const { tasks, todoTasks, addTask } = useKanban();
    addTask("Write report");
    expect(tasks.value).toHaveLength(1);
    expect(todoTasks.value).toHaveLength(1);
    expect(todoTasks.value[0].title).toBe("Write report");
    expect(todoTasks.value[0].status).toBe("todo");
  });

  it("trims whitespace from task titles", () => {
    const { todoTasks, addTask } = useKanban();
    addTask("  Trimmed  ");
    expect(todoTasks.value[0].title).toBe("Trimmed");
  });

  it("ignores empty task titles", () => {
    const { tasks, addTask } = useKanban();
    addTask("");
    addTask("   ");
    expect(tasks.value).toHaveLength(0);
  });

  it("moves task to in-progress", () => {
    const { todoTasks, inProgressTasks, addTask, moveTask } = useKanban();
    addTask("Task 1");
    const id = todoTasks.value[0].id;

    moveTask(id, "in-progress");
    expect(inProgressTasks.value).toHaveLength(1);
    expect(todoTasks.value).toHaveLength(0);
  });

  it("only allows one in-progress task at a time", () => {
    const { todoTasks, inProgressTasks, addTask, moveTask } = useKanban();
    addTask("Task 1");
    addTask("Task 2");

    const id1 = todoTasks.value[0].id;
    const id2 = todoTasks.value[1].id;

    moveTask(id1, "in-progress");
    expect(inProgressTasks.value).toHaveLength(1);

    moveTask(id2, "in-progress");
    // Task 1 should be moved back to todo
    expect(inProgressTasks.value).toHaveLength(1);
    expect(inProgressTasks.value[0].id).toBe(id2);
    expect(todoTasks.value).toHaveLength(1);
    expect(todoTasks.value[0].id).toBe(id1);
  });

  it("moves task to done with completedAt timestamp", () => {
    const { todoTasks, doneTasks, addTask, moveTask } = useKanban();
    addTask("Task 1");
    const id = todoTasks.value[0].id;

    const before = Date.now();
    moveTask(id, "done");
    const after = Date.now();

    expect(doneTasks.value).toHaveLength(1);
    expect(doneTasks.value[0].completedAt).toBeGreaterThanOrEqual(before);
    expect(doneTasks.value[0].completedAt).toBeLessThanOrEqual(after);
  });

  it("clears completedAt when moving back from done", () => {
    const { todoTasks, doneTasks, addTask, moveTask } = useKanban();
    addTask("Task 1");
    const id = todoTasks.value[0].id;

    moveTask(id, "done");
    expect(doneTasks.value[0].completedAt).toBeDefined();

    moveTask(id, "todo");
    expect(todoTasks.value[0].completedAt).toBeUndefined();
  });

  it("deletes a task", () => {
    const { tasks, addTask, deleteTask } = useKanban();
    addTask("Task 1");
    const id = tasks.value[0].id;

    deleteTask(id);
    expect(tasks.value).toHaveLength(0);
  });

  it("increments pomodoros on active task", () => {
    const {
      todoTasks,
      addTask,
      moveTask,
      incrementActiveTaskPomodoros,
      activeTask,
    } = useKanban();
    addTask("Task 1");
    const id = todoTasks.value[0].id;

    moveTask(id, "in-progress");
    expect(activeTask.value!.pomodorosCompleted).toBe(0);

    incrementActiveTaskPomodoros();
    expect(activeTask.value!.pomodorosCompleted).toBe(1);

    incrementActiveTaskPomodoros();
    expect(activeTask.value!.pomodorosCompleted).toBe(2);
  });

  it("clears done tasks", () => {
    const { tasks, todoTasks, doneTasks, addTask, moveTask, clearDoneTasks } =
      useKanban();
    addTask("Task 1");
    addTask("Task 2");

    moveTask(todoTasks.value[0].id, "done");
    expect(doneTasks.value).toHaveLength(1);
    expect(tasks.value).toHaveLength(2);

    clearDoneTasks();
    expect(doneTasks.value).toHaveLength(0);
    expect(tasks.value).toHaveLength(1);
  });

  it("clears all tasks", () => {
    const { tasks, addTask, clearAllTasks } = useKanban();
    addTask("Task 1");
    addTask("Task 2");
    expect(tasks.value).toHaveLength(2);

    clearAllTasks();
    expect(tasks.value).toHaveLength(0);
  });

  it("activeTask returns null when no in-progress task", () => {
    const { activeTask, addTask } = useKanban();
    addTask("Task 1");
    expect(activeTask.value).toBeNull();
  });
});
