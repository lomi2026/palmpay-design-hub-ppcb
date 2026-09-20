export type CurrentUserFailureKind = 'unauthenticated' | 'unavailable' | 'unexpected';

const UNAUTHENTICATED_STATUSES = new Set([401, 403, 404]);
const TEMPORARILY_UNAVAILABLE_STATUSES = new Set([408, 425, 429]);

function errorStatus(error: unknown) {
  if (typeof error !== 'object' || error === null || !('status' in error)) return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' && Number.isInteger(status) ? status : null;
}

function errorName(error: unknown) {
  if (typeof error !== 'object' || error === null || !('name' in error)) return null;
  const name = (error as { name?: unknown }).name;
  return typeof name === 'string' ? name : null;
}

export function classifyCurrentUserFailure(error: unknown): CurrentUserFailureKind {
  const status = errorStatus(error);
  if (status !== null) {
    if (UNAUTHENTICATED_STATUSES.has(status)) return 'unauthenticated';
    if (TEMPORARILY_UNAVAILABLE_STATUSES.has(status) || status >= 500) return 'unavailable';
    return 'unexpected';
  }

  if (['AbortError', 'TimeoutError'].includes(errorName(error) ?? '')) return 'unavailable';
  if (error instanceof TypeError) return 'unavailable';
  return 'unexpected';
}

export function currentUserRequestTimeoutMs(authMode: string | undefined) {
  return authMode === 'test' ? 70_000 : 12_000;
}
