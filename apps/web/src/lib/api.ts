import { appPath } from './app-path';
import { userError } from './user-error';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiError(response: Response) {
  let message = `API request failed with status ${response.status}`;
  try {
    const body = await response.json() as { message?: string | string[] };
    if (Array.isArray(body.message)) message = body.message.join('；');
    else if (body.message) message = body.message;
  } catch {}
  return new ApiError(response.status, userError(message, undefined, response.status));
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(process.env.NEXT_PUBLIC_APP_BASE_PATH ? appPath(path) : `${apiBaseUrl}${path}`, {
    ...init,
    cache: 'no-store',
    headers: { Accept: 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    throw await apiError(response);
  }

  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new ApiError(401, '登录已失效，请重新登录。');
  }

  return response.json() as Promise<T>;
}

export async function serverApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const started = performance.now();
  let status = 0;
  try {
    const serverApiBaseUrl = process.env.API_BASE_URL ?? apiBaseUrl;
    const response = await fetch(`${serverApiBaseUrl}${path}`, {
      ...init,
      cache: 'no-store',
      signal: init?.signal ?? AbortSignal.timeout(15000),
      headers: { Accept: 'application/json', ...init?.headers },
    });
    status = response.status;
    if (!response.ok) throw await apiError(response);
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new ApiError(401, '登录已失效，请重新登录。');
    }
    return await response.json() as T;
  } finally {
    // Opt-in operational timing; omit identity, query strings, request bodies and tokens.
    if (process.env.PERFORMANCE_TRACE === '1') console.info(JSON.stringify({
      metric: 'workspace.api', resource: path.split('?')[0]?.split('/').slice(0, 3).join('/'),
      method: init?.method ?? 'GET', status, durationMs: Math.round(performance.now() - started),
    }));
  }
}

export async function optionalServerApiFetch<T>(
  path: string,
  init: RequestInit | undefined,
  fallback: T,
  timeoutMs = 3500,
): Promise<T> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal;

  try {
    return await serverApiFetch<T>(path, { ...init, signal });
  } catch {
    return fallback;
  }
}
