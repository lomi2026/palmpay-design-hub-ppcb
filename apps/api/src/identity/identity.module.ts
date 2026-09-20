import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GovernanceModule } from '../governance/governance.module';
import { IdentityController, PermissionController } from './identity.controller';
import { IdentityService } from './identity.service';

@Module({
  imports: [AuthModule, GovernanceModule],
  controllers: [IdentityController, PermissionController],
  providers: [IdentityService],
})
export class IdentityModule {}
