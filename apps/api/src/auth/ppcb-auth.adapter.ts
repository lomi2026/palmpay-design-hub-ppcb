import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { AuthenticatedRequest, AuthenticationAdapter, ExternalIdentity } from './auth.types';

function header(request: AuthenticatedRequest, key: string) {
  const value = request.headers[key];
  if (typeof value !== 'string') return '';
  try { return decodeURIComponent(value); } catch { throw new UnauthorizedException('Invalid gateway identity.'); }
}

export function parsePpcbPermissions(value: string): string[] {
  if (!value.trim()) return [];
  let items: unknown;
  try { items = value.trim().startsWith('[') ? JSON.parse(value) : value.split(','); }
  catch { throw new UnauthorizedException('Invalid gateway permissions.'); }
  if (!Array.isArray(items) || items.some((item) => typeof item !== 'string' || !/^[a-z][a-z0-9_.:-]*$/.test(item.trim()))) {
    throw new UnauthorizedException('Invalid gateway permissions.');
  }
  return [...new Set(items.map((item: string) => item.trim()))];
}

@Injectable()
export class PpcbAuthAdapter implements AuthenticationAdapter {
  constructor(private readonly config: ConfigService) {}

  authenticate(request: AuthenticatedRequest): ExternalIdentity {
    const expected = this.config.get<string>('PPCB_INTERNAL_SECRET') ?? '';
    const received = header(request, 'x-hub-internal-secret');
    if (this.config.get('AUTH_MODE') !== 'ppcb' || !expected || Buffer.byteLength(received) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
      throw new UnauthorizedException('Trusted gateway authentication is required.');
    }
    const userId = header(request, 'x-ppcb-user-id');
    const corpId = header(request, 'x-ppcb-corp-id');
    const appId = header(request, 'x-ppcb-application-id');
    const role = header(request, 'x-ppcb-app-role');
    if (!userId || !corpId || appId !== this.config.get('PPCB_APPLICATION_ID') || !['Owner', 'Maintainer', 'Operator', 'User'].includes(role)) {
      throw new UnauthorizedException('Valid PPCB application identity is required.');
    }
    const employeeId = `ppcb:${createHash('sha256').update(`${corpId}:${userId}`).digest('hex')}`;
    const owner = role === 'Owner' && userId === this.config.get('PPCB_OWNER_USER_ID');
    // The reserved address is an internal account key, never a claimed employee email.
    const email = owner ? this.config.get<string>('PPCB_OWNER_EMAIL') : undefined;
    return {
      employeeId,
      email: email || `${employeeId.slice(5)}@identity.ppcb.invalid`,
      name: header(request, 'x-ppcb-user-name').slice(0, 100) || userId,
      ppcb: { owner, permissions: parsePpcbPermissions(header(request, 'x-ppcb-app-permissions')) },
    };
  }
}
