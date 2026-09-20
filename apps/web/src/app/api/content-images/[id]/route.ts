import { authenticatedApiHeaders } from '@/lib/auth';
import { ApiError, serverApiFetch } from '@/lib/api';

// Uploaded files have stable IDs; replacing a cover produces a new URL.
// Vary by Cookie so a different signed-in session cannot reuse this response.
const imageCacheHeaders = {
  'Cache-Control': 'private, max-age=86400, immutable',
  Vary: 'Cookie',
};
const errorHeaders = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' };

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const image = await serverApiFetch<{ url: string }>(`/api/files/${encodeURIComponent(id)}/image`, { headers: await authenticatedApiHeaders() });
    const etag = `"cover-${id}"`;
    // Check access before responding to a conditional request, including after expiry.
    if (request.headers.get('if-none-match')?.split(',').some(value => value.trim().replace(/^W\//, '') === etag)) {
      return new Response(null, { status: 304, headers: { ...imageCacheHeaders, ETag: etag } });
    }
    const response = await fetch(image.url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.ok) return new Response(null, { status: 404, headers: errorHeaders });
    return new Response(await response.arrayBuffer(), { headers: {
      'Content-Type': response.headers.get('content-type') ?? 'image/png',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      ...imageCacheHeaders,
      ETag: etag,
    } });
  } catch (error) {
    return new Response(null, { status: error instanceof ApiError ? error.status : 500, headers: errorHeaders });
  }
}
