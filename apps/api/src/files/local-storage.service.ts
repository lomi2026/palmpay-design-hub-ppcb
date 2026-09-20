import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

type LocalObjectMetadata = {
  sizeBytes: number;
  checksumSha256: string;
  mimeType: string | undefined;
};

type SignedAction = 'download' | 'upload';

type SignedPayload = {
  action: SignedAction;
  expiresAt: number;
  fileId: string;
  storageKey: string;
};

@Injectable()
export class LocalStorageService {
  constructor(private readonly config: ConfigService) {}

  createUploadUrl(input: { fileId: string; storageKey: string }) {
    return this.createSignedUrl('upload', input);
  }

  createDownloadUrl(input: { fileId: string; storageKey: string }) {
    return this.createSignedUrl('download', input);
  }

  async writeObject(input: {
    fileId: string;
    storageKey: string;
    token: string;
    mimeType: string;
    expectedSizeBytes: number;
    body: AsyncIterable<Uint8Array>;
  }) {
    this.verifyToken(input.token, 'upload', input.fileId, input.storageKey);
    const chunks: Buffer[] = [];
    let sizeBytes = 0;
    for await (const chunk of input.body) {
      const value = Buffer.from(chunk);
      sizeBytes += value.length;
      if (sizeBytes > input.expectedSizeBytes) {
        throw new BadRequestException('The uploaded file is larger than the declared size.');
      }
      chunks.push(value);
    }
    if (sizeBytes !== input.expectedSizeBytes) {
      throw new BadRequestException('The uploaded file size does not match the declared size.');
    }

    const destination = this.pathFor(input.storageKey);
    await mkdir(dirname(destination), { recursive: true });
    const temporary = `${destination}.${Date.now()}.uploading`;
    await writeFile(temporary, Buffer.concat(chunks));
    await rename(temporary, destination);
  }

  async readObjectMetadata(storageKey: string, mimeType: string): Promise<LocalObjectMetadata> {
    const value = await readFile(this.pathFor(storageKey));
    return {
      sizeBytes: value.length,
      checksumSha256: createHash('sha256').update(value).digest('base64'),
      mimeType,
    };
  }

  async readObject(input: { fileId: string; storageKey: string; token: string }) {
    this.verifyToken(input.token, 'download', input.fileId, input.storageKey);
    return readFile(this.pathFor(input.storageKey));
  }

  async deleteObject(storageKey: string) {
    await rm(this.pathFor(storageKey), { force: true });
  }

  private createSignedUrl(action: SignedAction, input: { fileId: string; storageKey: string }) {
    const expiresInSeconds = this.expiresInSeconds();
    const payload: SignedPayload = {
      action,
      fileId: input.fileId,
      storageKey: input.storageKey,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    };
    const token = this.sign(payload);
    const apiBaseUrl = (this.config.get<string>('API_BASE_URL') ?? 'http://localhost:3001').replace(/\/$/, '');
    return {
      url: `${apiBaseUrl}/api/files/local/${input.fileId}/object?token=${encodeURIComponent(token)}`,
      expiresInSeconds,
    };
  }

  private verifyToken(token: string, action: SignedAction, fileId: string, storageKey: string) {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) throw new BadRequestException('The local storage URL is invalid.');
    const expectedSignature = createHmac('sha256', this.signingSecret()).update(encodedPayload).digest('base64url');
    const received = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      throw new BadRequestException('The local storage URL signature is invalid.');
    }

    let payload: SignedPayload;
    try {
      payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SignedPayload;
    } catch {
      throw new BadRequestException('The local storage URL is invalid.');
    }
    if (
      payload.action !== action ||
      payload.fileId !== fileId ||
      payload.storageKey !== storageKey ||
      payload.expiresAt < Date.now()
    ) {
      throw new BadRequestException('The local storage URL has expired or is invalid.');
    }
  }

  private sign(payload: SignedPayload) {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', this.signingSecret()).update(encodedPayload).digest('base64url');
    return `${encodedPayload}.${signature}`;
  }

  private signingSecret() {
    const configured = this.config.get<string>('LOCAL_STORAGE_SIGNING_SECRET');
    if (configured) return configured;
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new ServiceUnavailableException('LOCAL_STORAGE_SIGNING_SECRET must be set for local file storage.');
    }
    return 'palmpay-development-local-storage-only';
  }

  private expiresInSeconds() {
    const configured = Number(this.config.get<string>('FILE_STORAGE_SIGNED_URL_TTL_SECONDS') ?? 300);
    return Number.isFinite(configured) ? Math.max(60, Math.min(configured, 900)) : 300;
  }

  private pathFor(storageKey: string) {
    const root = resolve(this.config.get<string>('LOCAL_STORAGE_PATH') ?? '/private/tmp/palmpay-design-intelligence-uploads');
    const value = resolve(root, storageKey);
    if (!value.startsWith(`${root}/`)) throw new BadRequestException('Invalid local storage key.');
    return value;
  }
}
