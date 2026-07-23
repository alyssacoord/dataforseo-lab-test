export type Mode = 'sandbox' | 'live';

export interface DataForSEOTask<T> {
  status_code?: number;
  status_message?: string;
  result?: Array<{ items?: T[]; total_count?: number } & Record<string, unknown>> | null;
}

export interface DataForSEOEnvelope<T> {
  status_code?: number;
  status_message?: string;
  tasks?: Array<DataForSEOTask<T>>;
}

export interface ProxyResult<T = unknown> {
  requestUrl?: string;
  httpStatus?: number;
  elapsedMs?: number;
  data?: DataForSEOEnvelope<T>;
  error?: string;
}

interface RunParams {
  path: string;
  method?: 'GET' | 'POST';
  body?: unknown;
  mode: Mode;
  taskId?: string;
}

export async function runDataForSEO<T = unknown>(params: RunParams): Promise<ProxyResult<T>> {
  const res = await fetch('/api/dataforseo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'POST', ...params }),
  });
  return res.json();
}

export function extractItems<T>(result: ProxyResult<T>): T[] {
  const taskResult = result.data?.tasks?.[0]?.result;
  if (!taskResult) return [];
  const first = taskResult[0];
  // Most endpoints wrap their items in result[0].items. A few (e.g.
  // keywords_data/google_ads/search_volume/live) return `result` itself as a
  // flat array of item objects, with no items/items_count wrapper at all —
  // detect that shape and fall back to treating `result` as the item list.
  if (first && typeof first === 'object' && 'items' in first) {
    return (first.items as T[] | undefined) ?? [];
  }
  return (taskResult as unknown[]).filter((item): item is T => item != null);
}

export function extractTotalCount<T>(result: ProxyResult<T>): number | null {
  return result.data?.tasks?.[0]?.result?.[0]?.total_count ?? null;
}

export function extractError<T>(result: ProxyResult<T>): string | null {
  if (result.error) return result.error;
  const task = result.data?.tasks?.[0];
  if (task?.status_code && task.status_code !== 20000) {
    return task.status_message ?? `Task error ${task.status_code}`;
  }
  if (result.data?.status_code && result.data.status_code !== 20000) {
    return result.data.status_message ?? `API error ${result.data.status_code}`;
  }
  return null;
}
