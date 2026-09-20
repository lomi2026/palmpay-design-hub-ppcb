import { loadCurrentUser } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const user = await loadCurrentUser();
    if (!user) return Response.json({}, {status: 401, headers: {'Cache-Control': 'no-store'}});
    return Response.json({scope: JSON.stringify([user.id, user.organizationId, [...user.permissions].sort()])}, {headers: {'Cache-Control': 'private, no-store'}});
  } catch {
    return Response.json({}, {status: 503, headers: {'Cache-Control': 'no-store'}});
  }
}
