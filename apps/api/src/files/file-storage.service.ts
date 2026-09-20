import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalStorageService } from './local-storage.service';
import { PpcbStorageService } from './ppcb-storage.service';
import { R2StorageService } from './r2-storage.service';

@Injectable()
export class FileStorageService {
  constructor(
    private readonly config: ConfigService,
    private readonly local: LocalStorageService,
    private readonly r2: R2StorageService,
    private readonly ppcb: PpcbStorageService,
  ) {}

  isLocal() {
    return this.driver() === 'local';
  }

  isPpcb() {
    return this.driver() === 'ppcb';
  }

  async createUploadUrl(input: { fileId?: string; storageKey: string; mimeType: string; originalName: string; sizeBytes: number }) {
    if (this.isLocal()) {
      if (!input.fileId) throw new ServiceUnavailableException('A file id is required for local storage.');
      return this.local.createUploadUrl({ fileId: input.fileId, storageKey: input.storageKey });
    }
    if (this.isPpcb()) {
      // PPCB's signed OSS URL currently rejects non-ASCII object filenames.
      // The application keeps the user's original name in FileAttachment, so
      // use the generated ASCII storage key only for the private OSS object.
      const filename = input.storageKey.split('/').pop() || 'upload';
      return this.ppcb.createUpload({ filename, contentType: input.mimeType, sizeBytes: input.sizeBytes });
    }
    return this.r2.createUploadUrl(input);
  }

  readObjectMetadata(storageKey: string, mimeType: string) {
    if (this.isPpcb()) throw new ServiceUnavailableException('PPCB verifies object metadata when upload completion is confirmed.');
    return this.isLocal()
      ? this.local.readObjectMetadata(storageKey, mimeType)
      : this.r2.readObjectMetadata(storageKey);
  }

  completeUpload(storageKey: string, checksumSha256: string) {
    if (!this.isPpcb()) return Promise.resolve();
    return this.ppcb.completeUpload(storageKey, checksumSha256);
  }

  createDownloadUrl(input: { fileId: string; storageKey: string }) {
    if (this.isPpcb()) return this.ppcb.createDownloadUrl(input.storageKey);
    return this.isLocal()
      ? this.local.createDownloadUrl(input)
      : this.r2.createDownloadUrl(input.storageKey);
  }

  deleteObject(storageKey: string) {
    if (this.isPpcb()) return Promise.resolve();
    return this.isLocal() ? this.local.deleteObject(storageKey) : this.r2.deleteObject(storageKey);
  }

  writeLocalObject(input: Parameters<LocalStorageService['writeObject']>[0]) {
    if (!this.isLocal()) throw new ServiceUnavailableException('Local file storage is not enabled.');
    return this.local.writeObject(input);
  }

  readLocalObject(input: Parameters<LocalStorageService['readObject']>[0]) {
    if (!this.isLocal()) throw new ServiceUnavailableException('Local file storage is not enabled.');
    return this.local.readObject(input);
  }

  private driver() {
    const value = (this.config.get<string>('FILE_STORAGE_DRIVER') ?? 'local').toLowerCase();
    if (value === 'local' || value === 'r2' || value === 'ppcb') return value;
    throw new ServiceUnavailableException('FILE_STORAGE_DRIVER must be local, r2 or ppcb.');
  }
}
