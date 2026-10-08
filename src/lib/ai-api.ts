import { NextResponse } from 'next/server';

export const AI_TIMEOUT_MS = 10_000;

export function jsonError(detail: string, status: number) {
  return NextResponse.json({ detail }, { status });
}

export function aiUrl(pathname: string): URL | null {
  const apiUrl = process.env.AI_API_URL?.trim();
  if (!apiUrl) return null;

  try {
    return new URL(pathname, apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`);
  } catch {
    return null;
  }
}

export async function aiFetch(target: URL) {
  return fetch(target, {
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });
}
