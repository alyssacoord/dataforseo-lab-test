import { NextResponse } from 'next/server';

export async function GET() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  return NextResponse.json({ credentialsLoaded: Boolean(login && password), login: login ?? null });
}
