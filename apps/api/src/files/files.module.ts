import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FileStorageService } from './file-storage.service';
import { LocalFilesController } from './local-files.controller';
import { LocalStorageService } from './local-storage.service';
import { R2StorageService } from './r2-storage.service';
import { PpcbStorageService } from './ppcb-storage.service';
import { GovernanceModule } from '../governance/governance.module';

@Module({
  imports: [AuthModule, DatabaseModule, GovernanceModule],
  controllers: [FilesController, LocalFilesController],
  providers: [FilesService, FileStorageService, LocalStorageService, R2StorageService, PpcbStorageService],
})
export class FilesModule {}
