import { cookies } from 'next/headers';
import { ppcbAuthenticationHeaders } from './ppcb-auth';
import { cache } from 'react';
import { serverApiFetch } from './api';
import { classifyCurrentUserFailure, currentUserRequestTimeoutMs } from './auth-failure';

export const DEVELOPMENT_USER_COOKIE = 'palmpay_dev_user_email';
export const TEST_SESSION_COOKIE = 'palmpay_test_session';

export interface CurrentUser {
  id: string;
  organizationId: string;
  primaryTeamId: string | null;
  employeeId: string | null;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: 'INVITED' | 'ACTIVE' | 'DISABLED';
  locale: string;
  roles: Array<{ code: string; scopeType: 'ORGANIZATION' | 'TEAM'; scopeId: string }>;
  permissions: string[];
}

export class AuthenticationServiceUnavailableError extends Error {
  constructor(cause: unknown) {
    super('The authentication service is temporarily unavailable.', { cause });
    this.name = 'AuthenticationServiceUnavailableError';
  }
}

const loadAuthenticationCookies = cache(async () => {
  const cookieStore = await cookies();
  return {
    developmentEmail: cookieStore.get(DEVELOPMENT_USER_COOKIE)?.value,
    testSession: cookieStore.get(TEST_SESSION_COOKIE)?.value,
  };
});

export const hasAuthenticationSession = cache(async () => {
  if (process.env.AUTH_MODE === 'ppcb') return Boolean((await ppcbAuthenticationHeaders())['x-ppcb-user-id']);
  const { developmentEmail, testSession } = await loadAuthenticationCookies();
  return Boolean(developmentEmail || testSession);
});

export const loadCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const { developmentEmail, testSession } = await loadAuthenticationCookies();

  const gatewayHeaders = process.env.AUTH_MODE === 'ppcb' ? await ppcbAuthenticationHeaders() : null;
  if (gatewayHeaders ? !gatewayHeaders['x-ppcb-user-id'] : !developmentEmail && !testSession) return null;

  try {
    return await serverApiFetch<CurrentUser>('/api/me', {
      signal: AbortSignal.timeout(currentUserRequestTimeoutMs(process.env.AUTH_MODE)),
      headers: gatewayHeaders ?? (testSession ? { Authorization: `Bearer ${testSession}` } : { 'x-dev-user-email': developmentEmail! }),
    });
  } catch (error: unknown) {
    const failureKind = classifyCurrentUserFailure(error);
    if (failureKind === 'unauthenticated') return null;
    if (failureKind === 'unavailable') throw new AuthenticationServiceUnavailableError(error);
    throw error;
  }
});

export const authenticatedApiHeaders = cache(async (): Promise<Record<string, string>> => {
  if (process.env.AUTH_MODE === 'ppcb') return ppcbAuthenticationHeaders();
  const { developmentEmail, testSession } = await loadAuthenticationCookies();
  if (testSession) return { Authorization: `Bearer ${testSession}` };
  return developmentEmail ? { 'x-dev-user-email': developmentEmail } : {};
});
