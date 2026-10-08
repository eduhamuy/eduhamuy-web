import { NextRequest, NextResponse } from 'next/server';
import { aiFetch, aiUrl, jsonError } from '@/lib/ai-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!query) return jsonError('Query parameter "q" is required', 400);

  const rawLimit = request.nextUrl.searchParams.get('limit') ?? '5';
  const limit = Number.parseInt(rawLimit, 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return jsonError('Limit must be an integer between 1 and 50', 400);
  }

  const target = aiUrl('/search');
  if (!target) {
    return jsonError('AI search configuration is invalid', 503);
  }

  target.searchParams.set('q', query);
  target.searchParams.set('limit', String(limit));

  try {
    const response = await aiFetch(target);
    const body = await response.json().catch(() => ({ detail: 'Invalid AI response' }));

    return NextResponse.json(body, { status: response.status });
  } catch {
    return jsonError('AI search service is unavailable', 502);
  }
}
