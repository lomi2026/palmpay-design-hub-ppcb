import { authenticatedApiHeaders } from '@/lib/auth';
import { ApiError, serverApiFetch } from '@/lib/api';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await serverApiFetch(`/api/contents/${encodeURIComponent(id)}/usage-summary`, { headers: await authenticatedApiHeaders() });
    return Response.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return Response.json({ error: '统计暂时不可用' }, { status: error instanceof ApiError ? error.status : 503, headers: { 'Cache-Control': 'private, no-store' } }); }
}
