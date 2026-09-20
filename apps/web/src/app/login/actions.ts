'use server';

import { cookies } from 'next/headers';
import { appPath } from '@/lib/app-path';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { ApiError, serverApiFetch } from '@/lib/api';
import { DEVELOPMENT_USER_COOKIE, TEST_SESSION_COOKIE, type CurrentUser } from '@/lib/auth';

const LOGIN_REQUEST_TIMEOUT_MS = 70_000;

const loginSchema = z.object({ email: z.email().max(320) });

export async function developmentLogin(formData: FormData) {
  if (process.env.AUTH_MODE === 'ppcb') throw new Error('Use DingTalk login.');
  const result = loginSchema.safeParse({ email: formData.get('email') });
  if (!result.success) redirect('/login?error=invalid-email');

  const email = result.data.email.trim().toLowerCase();
  try {
    await serverApiFetch<CurrentUser>('/api/me', {
      signal: AbortSignal.timeout(12000),
      headers: { 'x-dev-user-email': email },
    });
  } catch {
    redirect('/login?error=user-unavailable');
  }

  const cookieStore = await cookies();
  cookieStore.delete(TEST_SESSION_COOKIE);
  cookieStore.set(DEVELOPMENT_USER_COOKIE, email, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  redirect('/workspace');
}

export async function testLogin(formData: FormData) {
  if (process.env.AUTH_MODE === 'ppcb') throw new Error('Use DingTalk login.');
  const result = loginSchema.safeParse({ email: formData.get('email') });
  if (!result.success) redirect('/login?error=invalid-credentials');

  try {
    const session = await serverApiFetch<{ accessToken: string; expiresAt: string }>('/api/auth/test-sessions', {
      method: 'POST',
      // Render's acceptance service sleeps when idle. Keep the request alive
      // long enough for a cold start instead of reporting a timeout as invalid
      // credentials.
      signal: AbortSignal.timeout(LOGIN_REQUEST_TIMEOUT_MS),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: result.data.email.trim().toLowerCase(),
      }),
    });
    const expiresAt = new Date(session.expiresAt);
    const cookieStore = await cookies();
    cookieStore.set(TEST_SESSION_COOKIE, session.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      expires: Number.isNaN(expiresAt.valueOf()) ? undefined : expiresAt,
    });
  } catch (error: unknown) {
    if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
      redirect('/login?error=invalid-credentials');
    }
    redirect('/login?error=service-unavailable');
  }
  redirect('/workspace');
}

export async function logout() {
  if (process.env.AUTH_MODE === 'ppcb') redirect(new URL(`/api/auth/logout?returnTo=${encodeURIComponent(appPath('/'))}`, process.env.PPCB_PORTAL_ORIGIN).toString());
  const cookieStore = await cookies();
  cookieStore.delete(DEVELOPMENT_USER_COOKIE);
  cookieStore.delete(TEST_SESSION_COOKIE);
  redirect('/login');
}
