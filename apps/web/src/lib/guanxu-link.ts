import { appPath } from './app-path';

/** Only the configured tool origin is rewritten; other tools keep their URLs. */
export function guanxuToolLink(url: string | undefined): string | undefined {
  if (!url || process.env.GUANXU_SSO_ENABLED !== 'true' || process.env.AUTH_MODE !== 'ppcb') return url;
  try {
    const target = new URL(url);
    if (target.origin === new URL(process.env.GUANXU_ORIGIN || '').origin && !target.username && !target.password) {
      return appPath('/sso/guanxu');
    }
  } catch { /* Leave unrelated URLs to their existing validation. */ }
  return url;
}
