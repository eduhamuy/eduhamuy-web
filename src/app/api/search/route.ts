import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SEARCH_TIMEOUT_MS = 5000;

function jsonError(detail: string, status: number) {
  return NextResponse.json({ detail }, { status });
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!query) return jsonError('Query parameter "q" is required', 400);

  const rawLimit = request.nextUrl.searchParams.get('limit') ?? '5';
  const limit = Number.parseInt(rawLimit, 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return jsonError('Limit must be an integer between 1 and 50', 400);
  }

  const apiUrl = process.env.AI_API_URL?.trim();
  if (!apiUrl) return jsonError('AI search is not configured', 503);

  let target: URL;
  try {
    target = new URL('/search', apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`);
  } catch {
    return jsonError('AI search configuration is invalid', 503);
  }

  target.searchParams.set('q', query);
  target.searchParams.set('limit', String(limit));

  try {
    const response = await fetch(target, {
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });
    const body = await response.json().catch(() => ({ detail: 'Invalid AI response' }));

    return NextResponse.json(body, { status: response.status });
  } catch {
    return jsonError('AI search service is unavailable', 502);
  }
}
