import { describe, it, expect, beforeEach, vi } from "vitest";

let useSessionHistory: typeof import("../composables/useSessionHistory").useSessionHistory;

// Mock fetch — GET /api/sessions returns [], all mutations return ok
const mockFetch = vi
  .fn()
  .mockImplementation((_url: string, options?: RequestInit) => {
    const method = options?.method ?? "GET";
    const body =
      method === "GET"
        ? JSON.stringify([])
        : JSON.stringify({ ok: true, count: 1 });
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(JSON.parse(body)),
    });
  });

vi.stubGlobal("fetch", mockFetch);

describe("useSessionHistory", () => {
  beforeEach(async () => {
    mockFetch.mockClear();
    vi.resetModules();
    const mod = await import("../composables/useSessionHistory");
    useSessionHistory = mod.useSessionHistory;
  });

  it("starts with empty history", () => {
    const { history } = useSessionHistory();
    expect(history.value.entries).toEqual([]);
  });

  it("records a session", () => {
    const { history, recordSession } = useSessionHistory();
    const now = Date.now();

    recordSession("focus", "Test", 1500, now - 1500000);

    expect(history.value.entries).toHaveLength(1);
    expect(history.value.entries[0].type).toBe("focus");
    expect(history.value.entries[0].label).toBe("Test");
    expect(history.value.entries[0].duration).toBe(1500);
  });

  it("prepends new entries (newest first)", () => {
    const { history, recordSession } = useSessionHistory();

    recordSession("focus", "First", 1500, Date.now() - 2000);
    recordSession("focus", "Second", 1500, Date.now() - 1000);

    expect(history.value.entries[0].label).toBe("Second");
    expect(history.value.entries[1].label).toBe("First");
  });

  it("caps entries at MAX_ENTRIES (500)", () => {
    const { history, recordSession } = useSessionHistory();

    for (let i = 0; i < 505; i++) {
      recordSession("focus", `Session ${i}`, 1500, Date.now());
    }

    expect(history.value.entries.length).toBeLessThanOrEqual(500);
  });

  it("filters today entries correctly", () => {
    const { todayEntries, recordSession } = useSessionHistory();

    recordSession("focus", "Today", 1500, Date.now() - 1500000);

    expect(todayEntries.value).toHaveLength(1);
    expect(todayEntries.value[0].label).toBe("Today");
  });

  it("calculates today stats", () => {
    const { todayStats, recordSession } = useSessionHistory();

    recordSession("focus", "Work", 1500, Date.now() - 1500000);
    recordSession("focus", "Work", 1500, Date.now() - 1500000);
    recordSession("short-break", "", 300, Date.now() - 300000);

    expect(todayStats.value.focusCount).toBe(2);
    expect(todayStats.value.breakCount).toBe(1);
    expect(todayStats.value.totalFocusMinutes).toBe(50); // 3000 seconds = 50 min
  });

  it("groups stats by label", () => {
    const { todayStats, recordSession } = useSessionHistory();

    recordSession("focus", "Project A", 1500, Date.now());
    recordSession("focus", "Project A", 1500, Date.now());
    recordSession("focus", "Project B", 1500, Date.now());

    const breakdown = todayStats.value.labelBreakdown;
    const projectA = breakdown.find((b) => b.label === "Project A");
    const projectB = breakdown.find((b) => b.label === "Project B");

    expect(projectA?.count).toBe(2);
    expect(projectB?.count).toBe(1);
  });

  it("trims label whitespace", () => {
    const { history, recordSession } = useSessionHistory();
    recordSession("focus", "  Trimmed  ", 1500, Date.now());
    expect(history.value.entries[0].label).toBe("Trimmed");
  });

  it("clears history", () => {
    const { history, recordSession, clearHistory } = useSessionHistory();
    recordSession("focus", "Test", 1500, Date.now());
    expect(history.value.entries).toHaveLength(1);

    clearHistory();
    expect(history.value.entries).toHaveLength(0);
  });

  it("tracks recent labels", () => {
    const { recentLabels, recordSession } = useSessionHistory();

    recordSession("focus", "Alpha", 1500, Date.now());
    recordSession("focus", "Beta", 1500, Date.now());
    recordSession("focus", "Alpha", 1500, Date.now()); // duplicate

    expect(recentLabels.value).toContain("Alpha");
    expect(recentLabels.value).toContain("Beta");
    // Should be unique
    expect(recentLabels.value.filter((l) => l === "Alpha")).toHaveLength(1);
  });

  it("limits recent labels to 10", () => {
    const { recentLabels, recordSession } = useSessionHistory();

    for (let i = 0; i < 15; i++) {
      recordSession("focus", `Label ${i}`, 1500, Date.now());
    }

    expect(recentLabels.value.length).toBeLessThanOrEqual(10);
  });
});
