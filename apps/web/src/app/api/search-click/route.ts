import { authenticatedApiHeaders } from '@/lib/auth';
import { ApiError, serverApiFetch } from '@/lib/api';
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return new Response(null, { status: 403 });
  try {
    const { searchLogId, contentId } = await request.json();
    if (typeof searchLogId !== 'string' || typeof contentId !== 'string' || !searchLogId || !contentId || searchLogId.length > 100 || contentId.length > 100) return new Response(null, { status: 400 });
    await serverApiFetch(`/api/search/${encodeURIComponent(searchLogId)}/click`, { method: 'PATCH', headers: { ...(await authenticatedApiHeaders()), 'Content-Type': 'application/json' }, body: JSON.stringify({ contentId }), signal: AbortSignal.timeout(5000) });
    return new Response(null, { status: 204 });
  } catch (error) { return new Response(null, { status: error instanceof ApiError ? error.status : 503 }); }
}
