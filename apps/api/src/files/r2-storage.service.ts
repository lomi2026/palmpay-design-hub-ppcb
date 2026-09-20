import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type R2ObjectMetadata = {
  sizeBytes: number;
  checksumSha256: string | undefined;
  mimeType: string | undefined;
};

@Injectable()
export class R2StorageService {
  constructor(private readonly config: ConfigService) {}

  async createUploadUrl(input: {
    storageKey: string;
    mimeType: string;
  }) {
    const { client, bucket, expiresInSeconds } = this.connection();
    const url = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.storageKey,
        ContentType: input.mimeType,
      }),
      { expiresIn: expiresInSeconds },
    );
    return { url, expiresInSeconds };
  }

  async readObjectMetadata(storageKey: string): Promise<R2ObjectMetadata> {
    const { client, bucket } = this.connection();
    const object = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: storageKey }));
    const download = await client.send(new GetObjectCommand({ Bucket: bucket, Key: storageKey }));
    if (!download.Body) throw new ServiceUnavailableException('Cloudflare R2 returned an empty object body.');

    const checksum = createHash('sha256');
    for await (const chunk of download.Body as AsyncIterable<Uint8Array>) {
      checksum.update(chunk);
    }

    return {
      sizeBytes: object.ContentLength ?? 0,
      checksumSha256: checksum.digest('base64'),
      mimeType: object.ContentType,
    };
  }

  async createDownloadUrl(storageKey: string) {
    const { client, bucket, expiresInSeconds } = this.connection();
    const url = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: storageKey }),
      { expiresIn: expiresInSeconds },
    );
    return { url, expiresInSeconds };
  }

  async deleteObject(storageKey: string) {
    const { client, bucket } = this.connection();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: storageKey }));
  }

  private connection() {
    const endpoint = this.config.get<string>('R2_ENDPOINT');
    const bucket = this.config.get<string>('R2_BUCKET');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      throw new ServiceUnavailableException(
        'Cloudflare R2 is not configured. Set R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.',
      );
    }

    const configuredTtl = Number(this.config.get<string>('R2_SIGNED_URL_TTL_SECONDS') ?? 300);
    const expiresInSeconds = Number.isFinite(configuredTtl)
      ? Math.max(60, Math.min(configuredTtl, 900))
      : 300;

    return {
      bucket,
      expiresInSeconds,
      client: new S3Client({
        endpoint,
        region: 'auto',
        forcePathStyle: true,
        credentials: { accessKeyId, secretAccessKey },
      }),
    };
  }
}
