import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDatabaseAdapter } from './connection';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService) {
    const connectionString = config.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error('DATABASE_URL is required to start the API.');
    }

    super({ adapter: createDatabaseAdapter(connectionString) });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
