const fallbackTarget = '/workspace/notifications';

export function safeNotificationTarget(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !value.startsWith('/workspace')) return fallbackTarget;

  try {
    const base = new URL('https://palmpay.invalid');
    const target = new URL(value, base);
    if (
      target.origin !== base.origin ||
      (target.pathname !== '/workspace' && !target.pathname.startsWith('/workspace/'))
    ) {
      return fallbackTarget;
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallbackTarget;
  }
}
