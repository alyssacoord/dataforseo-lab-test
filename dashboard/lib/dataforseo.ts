export type Mode = 'sandbox' | 'live';

export interface DataForSEOTask<T> {
  status_code?: number;
  status_message?: string;
  result?: Array<{ items?: T[] } & Record<string, unknown>> | null;
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
  return result.data?.tasks?.[0]?.result?.[0]?.items ?? [];
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
