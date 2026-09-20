import { ServiceUnavailableException } from '@nestjs/common';

type JsonObject = Record<string, unknown>;

const defaultRuntimeBaseUrl = 'http://ppcb-portal.ppcb-control.svc.cluster.local/api/runtime/v1';

export function resolvePpcbRuntimeBaseUrl(configured?: string) {
  const value = configured?.trim() || defaultRuntimeBaseUrl;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ServiceUnavailableException('PPCB_MESSAGE_API_URL is invalid.');
  }
  const pathname = url.pathname.replace(/\/+$/, '');
  if (!pathname) {
    url.pathname = '/api/runtime/v1';
  } else if (pathname.endsWith('/api/runtime/v1/dingtalk-messages')) {
    url.pathname = pathname.slice(0, -'/dingtalk-messages'.length);
  } else if (!pathname.endsWith('/api/runtime/v1')) {
    throw new ServiceUnavailableException('PPCB_MESSAGE_API_URL has an unsupported path.');
  }
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

function requiredString(body: JsonObject, keys: string[]) {
  for (const key of keys) {
    const value = body[key];
    if (typeof value === 'string' && value) return value;
  }
  throw new ServiceUnavailableException(`PPCB file storage response is missing ${keys.join(' or ')}.`);
}

function expiresInSeconds(body: JsonObject, fallback: number) {
  const direct = body.expiresInSeconds;
  if (typeof direct === 'number' && Number.isFinite(direct)) return direct;
  const expiresAt = body.expiresAt;
  if (typeof expiresAt === 'string') {
    const seconds = Math.floor((new Date(expiresAt).valueOf() - Date.now()) / 1000);
    if (Number.isFinite(seconds) && seconds > 0) return seconds;
  }
  return fallback;
}

export class PpcbStorageClient {
  constructor(private readonly environment: (key: string) => string | undefined) {}

  async createUpload(input: { filename: string; contentType: string; sizeBytes: number }) {
    const body = await this.request('/files/uploads', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    const responseHeaders = body.headers;
    const headers = responseHeaders && typeof responseHeaders === 'object'
      ? Object.fromEntries(
          Object.entries(responseHeaders)
            .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
            .map(([name, value]) => [name.toLowerCase(), value]),
        )
      : {};
    // The signed OSS URL includes content-type in its signature. Preserve the
    // platform-provided value exactly and avoid sending both `content-type`
    // and `Content-Type`, which Fetch combines into a comma-separated value.
    headers['content-type'] ??= input.contentType;
    return {
      storageKey: requiredString(body, ['fileId', 'id']),
      url: requiredString(body, ['uploadUrl', 'url']),
      headers,
      expiresInSeconds: expiresInSeconds(body, 600),
    };
  }

  async completeUpload(fileId: string, checksumSha256: string) {
    await this.request(`/files/uploads/${encodeURIComponent(fileId)}/complete`, {
      method: 'POST',
      body: JSON.stringify({ checksumSha256 }),
    });
  }

  async createDownloadUrl(fileId: string) {
    const body = await this.request(`/files/${encodeURIComponent(fileId)}/download-url`, {
      method: 'POST',
      body: '{}',
    });
    return {
      url: requiredString(body, ['downloadUrl', 'url']),
      expiresInSeconds: expiresInSeconds(body, 300),
    };
  }

  private async request(path: string, init: RequestInit) {
    const token = this.environment('PPCB_MESSAGE_SERVICE_TOKEN');
    if (!token) throw new ServiceUnavailableException('PPCB_MESSAGE_SERVICE_TOKEN is not available.');
    const baseUrl = resolvePpcbRuntimeBaseUrl(this.environment('PPCB_MESSAGE_API_URL'));
    const requestUrl = `${baseUrl}${path}`;
    const response = await fetch(requestUrl, {
      ...init,
      signal: AbortSignal.timeout(15_000),
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
    if (!response.ok) {
      throw new ServiceUnavailableException(
        `PPCB file storage request failed with status ${response.status} for ${new URL(requestUrl).pathname}.`,
      );
    }
    return response.json() as Promise<JsonObject>;
  }
}
