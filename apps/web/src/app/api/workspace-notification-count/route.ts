import { ApiError, serverApiFetch } from '@/lib/api';
import { authenticatedApiHeaders } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await serverApiFetch<{ unreadCount: number }>(
      '/api/notifications/unread-count',
      {
        headers: await authenticatedApiHeaders(),
        signal: AbortSignal.timeout(process.env.AUTH_MODE === 'test' ? 70_000 : 12_000),
      },
    );
    return Response.json(result, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error: unknown) {
    const status = error instanceof ApiError && error.status === 401 ? 401 : 503;
    return Response.json(
      { message: status === 401 ? 'Authentication is required.' : 'Notification service is temporarily unavailable.' },
      { status, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }
}
