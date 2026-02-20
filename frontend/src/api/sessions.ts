import type { SessionHistoryEntry } from "../composables/useSessionHistory";

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

export async function fetchSessions(): Promise<SessionHistoryEntry[]> {
  return request<SessionHistoryEntry[]>("/sessions");
}

export async function postSession(entry: SessionHistoryEntry): Promise<void> {
  await request("/sessions", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

export async function batchPostSessions(
  entries: SessionHistoryEntry[],
): Promise<void> {
  if (entries.length === 0) return;
  await request("/sessions/batch", {
    method: "POST",
    body: JSON.stringify(entries),
  });
}

export async function deleteAllSessions(): Promise<void> {
  await request("/sessions", { method: "DELETE" });
}
