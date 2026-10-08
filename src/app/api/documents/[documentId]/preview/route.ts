import { NextRequest } from 'next/server';
import { aiFetch, aiUrl, jsonError } from '@/lib/ai-api';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  if (!/^doc-[a-f0-9]{16}$/.test(documentId)) {
    return jsonError('Invalid document identifier', 400);
  }

  const target = aiUrl(`/documents/${encodeURIComponent(documentId)}/preview`);
  if (!target) return jsonError('AI catalog is not configured', 503);

  try {
    const response = await aiFetch(target);
    if (!response.ok || !response.body) {
      const body = await response.json().catch(() => ({ detail: 'Document preview is unavailable' }));
      return jsonError(body.detail ?? 'Document preview is unavailable', response.status);
    }

    const headers = new Headers();
    for (const name of ['content-type', 'content-disposition', 'cache-control']) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(response.body, { status: 200, headers });
  } catch {
    return jsonError('Document preview service is unavailable', 502);
  }
}
