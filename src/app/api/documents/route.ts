import { NextRequest, NextResponse } from 'next/server';
import { aiFetch, aiUrl, jsonError } from '@/lib/ai-api';

export const dynamic = 'force-dynamic';

function positiveInteger(value: string | null, fallback: number, maximum: number) {
  if (value === null) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= maximum ? parsed : null;
}

export async function GET(request: NextRequest) {
  const limit = positiveInteger(request.nextUrl.searchParams.get('limit'), 20, 50);
  const offset = positiveInteger(request.nextUrl.searchParams.get('offset'), 0, Number.MAX_SAFE_INTEGER);
  if (limit === null || limit < 1 || offset === null) {
    return jsonError('Invalid catalog pagination parameters', 400);
  }

  const target = aiUrl('/documents');
  if (!target) return jsonError('AI catalog is not configured', 503);
  target.searchParams.set('limit', String(limit));
  target.searchParams.set('offset', String(offset));

  try {
    const response = await aiFetch(target);
    const body = await response.json().catch(() => ({ detail: 'Invalid AI response' }));
    return NextResponse.json(body, { status: response.status });
  } catch {
    return jsonError('AI catalog service is unavailable', 502);
  }
}
