import { ApiError, serverApiFetch } from '@/lib/api';
import { authenticatedApiHeaders } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const headers = await authenticatedApiHeaders();
    const [favorites, projects] = await Promise.all([
      serverApiFetch<{items: Array<{content:{id:string}}>}>('/api/me/favorites', {headers}),
      serverApiFetch<{total:number}>('/api/contents?type=AI_PROJECT&pageSize=1', {headers}),
    ]);
    return Response.json({ids:favorites.items.map(item=>item.content.id),projectCount:projects.total},{headers:{'Cache-Control':'private, no-store'}});
  } catch(error) {
    return Response.json({error:'数据刷新暂时失败'}, {status:error instanceof ApiError && error.status===401 ? 401 : 503,headers:{'Cache-Control':'no-store'}});
  }
}
