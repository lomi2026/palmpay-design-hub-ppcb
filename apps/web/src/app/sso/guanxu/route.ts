import { loadCurrentUser } from '@/lib/auth';
import { createGuanxuAssertion, guanxuConfig } from '@/lib/guanxu-sso';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };
export async function GET(request: Request) {
  try {
    const config = guanxuConfig();
    if (!config) return new Response('统一登录尚未启用，请联系管理员。', { status: 503, headers });
    const state = new URL(request.url).searchParams.get('state');
    if (!state) return new Response(null, { status: 302, headers: { ...headers, Location: config.origin + '/auth/hub/start' } });
    if (!/^[A-Za-z0-9_-]{43}$/.test(state)) return new Response('登录请求无效。', { status: 400, headers });
    const user = await loadCurrentUser();
    if (!user) {
      const login = new URL('/api/auth/dingtalk/start', config.issuer);
      login.searchParams.set('returnTo', new URL(config.issuer).pathname + '/sso/guanxu?state=' + state);
      return new Response(null, { status: 302, headers: { ...headers, Location: login.href } });
    }
    if (!user.permissions.includes('content.read')) return new Response('当前账号无权进入观序。', { status: 403, headers });
    const callback = new URL('/auth/hub/callback', config.origin);
    // Fragment stays in the browser and is never sent to either host's access logs.
    callback.hash = new URLSearchParams({ token: createGuanxuAssertion(user, state, config) }).toString();
    return new Response(null, { status: 302, headers: { ...headers, Location: callback.href } });
  } catch {
    return new Response('统一登录暂时不可用，请返回 Hub 重试或联系管理员。', { status: 503, headers });
  }
}
