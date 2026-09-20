import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PpcbStorageClient } from './ppcb-storage.client';

@Injectable()
export class PpcbStorageService extends PpcbStorageClient {
  constructor(config: ConfigService) {
    super((key) => config.get<string>(key));
  }
}
