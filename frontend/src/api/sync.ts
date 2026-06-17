const BASE = "/api";

export interface AzureCredentials {
  accountName: string;
  containerName: string;
  accountKey: string;
}

export interface PushResult {
  ok: boolean;
  exportedSessions: number;
  exportedTasks: number;
  exportedAt: string;
}

export interface PullResult {
  ok: boolean;
  importedSessions: number;
  importedTasks: number;
  mergedSessions?: number;
  mergedTasks?: number;
  conflicts?: number;
}

export interface PullPreviewResult {
  ok: boolean;
  newSessions: number;
  newTasks: number;
  updatedSessions: number;
  updatedTasks: number;
  conflictCount: number;
}

export interface SyncInfoResult {
  ok: boolean;
  version: number;
  exportedAt: string | null;
  sessionCount: number;
  taskCount: number;
}

export interface PullRequest {
  merge?: boolean;
  conflictStrategy?: "keep_local" | "keep_cloud" | "keep_newer";
}

export interface SyncInfoRequest {
  accountName: string;
  containerName: string;
  accountKey: string;
}

async function request<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = data?.detail ?? res.statusText;
    throw new Error(
      typeof detail === "string" ? detail : JSON.stringify(detail),
    );
  }
  return res.json() as Promise<T>;
}

// GET request for sync/info and sync/pull/preview
async function getRequest<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}?${new URLSearchParams(body as Record<string, string>)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = data?.detail ?? res.statusText;
    throw new Error(
      typeof detail === "string" ? detail : JSON.stringify(detail),
    );
  }
  return res.json() as Promise<T>;
}

export async function pushToCloud(
  creds: AzureCredentials,
): Promise<PushResult> {
  return request<PushResult>("/sync/push", creds);
}

export async function pullFromCloud(
  creds: AzureCredentials,
  options?: PullRequest,
): Promise<PullResult> {
  const body = { ...creds, ...options };
  return request<PullResult>("/sync/pull", body);
}

export async function previewPullFromCloud(
  creds: AzureCredentials,
): Promise<PullPreviewResult> {
  return request<PullPreviewResult>("/sync/pull/preview", creds);
}

export async function getSyncInfo(
  creds: AzureCredentials,
): Promise<SyncInfoResult> {
  return request<SyncInfoResult>("/sync/info", creds);
}
