import { headers } from 'next/headers';
import { cache } from 'react';

export const ppcbAuthenticationHeaders = cache(async (): Promise<Record<string, string>> => {
  if (process.env.AUTH_MODE !== 'ppcb') return {};
  const incoming = await headers();
  if (!incoming.get('x-ppcb-user-id')) return {};
  const result: Record<string, string> = {};
  for (const key of ['application-id', 'user-id', 'user-name', 'corp-id', 'app-role', 'app-permissions']) {
    const value = incoming.get(`x-ppcb-${key}`);
    if (value) result[`x-ppcb-${key}`] = value;
  }
  if (process.env.PPCB_INTERNAL_SECRET) result['x-hub-internal-secret'] = process.env.PPCB_INTERNAL_SECRET;
  return result;
});
