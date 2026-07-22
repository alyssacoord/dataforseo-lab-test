import { NextRequest, NextResponse } from 'next/server';

const HOSTS: Record<string, string> = {
  sandbox: 'https://sandbox.dataforseo.com',
  live: 'https://api.dataforseo.com',
};

export async function POST(request: NextRequest) {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    return NextResponse.json(
      { error: 'DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD missing from dashboard/.env.local' },
      { status: 500 }
    );
  }

  const payload = await request.json().catch(() => null);
  const { path, method, body, mode, taskId } = payload ?? {};

  if (!path || !method) {
    return NextResponse.json({ error: 'Request must include path and method.' }, { status: 400 });
  }

  const host = HOSTS[mode as string] ?? HOSTS.sandbox;
  let resolvedPath: string = path;
  if (resolvedPath.includes('{id}')) {
    if (!taskId) {
      return NextResponse.json(
        { error: 'This endpoint needs a task id — run the matching task_post first.' },
        { status: 400 }
      );
    }
    resolvedPath = resolvedPath.replace('{id}', encodeURIComponent(taskId));
  }

  const url = `${host}/v3/${resolvedPath}`;
  const auth = Buffer.from(`${login}:${password}`).toString('base64');

  const fetchOpts: RequestInit = {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  };
  if (method === 'POST' && body !== undefined && body !== null) {
    fetchOpts.body = JSON.stringify(body);
  }

  const startedAt = Date.now();
  try {
    const upstream = await fetch(url, fetchOpts);
    const elapsedMs = Date.now() - startedAt;
    const text = await upstream.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    return NextResponse.json({ requestUrl: url, httpStatus: upstream.status, elapsedMs, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Request failed: ${message}`, requestUrl: url }, { status: 502 });
  }
}
