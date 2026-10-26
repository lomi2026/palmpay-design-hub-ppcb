import { createHmac, randomUUID } from 'node:crypto';
import type { CurrentUser } from './auth';

export function guanxuConfig(env: NodeJS.ProcessEnv = process.env) {
  if (env.AUTH_MODE !== 'ppcb' || env.GUANXU_SSO_ENABLED !== 'true') return null;
  const secret = env.GUANXU_SSO_SECRET || '';
  const origin = new URL(env.GUANXU_ORIGIN || '');
  const portal = new URL(env.PPCB_PORTAL_ORIGIN || '');
  const base = env.NEXT_PUBLIC_APP_BASE_PATH || '';
  if (!/^[a-f0-9]{64}$/i.test(secret) || origin.protocol !== 'https:' || origin.href !== `${origin.origin}/` ||
      portal.protocol !== 'https:' || portal.href !== `${portal.origin}/` || !/^\/apps\/[a-z0-9-]+$/.test(base)) {
    throw new Error('统一登录配置无效');
  }
  return { secret, origin: origin.origin, issuer: portal.origin + base };
}

export function createGuanxuAssertion(user: CurrentUser, state: string, config: NonNullable<ReturnType<typeof guanxuConfig>>, now = Math.floor(Date.now() / 1000)) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(state)) throw new Error('登录请求无效');
  if (user.status !== 'ACTIVE' || !/^ppcb:[a-f0-9]{64}$/.test(user.employeeId || '') || !user.permissions.includes('content.read')) {
    throw new Error('当前员工无权进入观序');
  }
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ iss: config.issuer, aud: config.origin, sub: user.employeeId,
    org: user.organizationId, name: user.name.slice(0, 100), nonce: state,
    iat: now, exp: now + 60, jti: randomUUID() })).toString('base64url');
  const input = `${header}.${payload}`;
  return `${input}.${createHmac('sha256', config.secret).update(input).digest('base64url')}`;
}
