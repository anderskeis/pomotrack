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

export async function pushToCloud(
  creds: AzureCredentials,
): Promise<PushResult> {
  return request<PushResult>("/sync/push", creds);
}

export async function pullFromCloud(
  creds: AzureCredentials,
): Promise<PullResult> {
  return request<PullResult>("/sync/pull", creds);
}
