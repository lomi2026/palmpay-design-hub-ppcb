import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EngagementModule } from '../engagement/engagement.module';
import { AnalyticsController, GovernanceController } from './governance.controller';
import { AnalyticsService } from './analytics.service';
import { AuditService } from './audit.service';
import { GovernanceService } from './governance.service';

@Module({
  imports: [AuthModule, EngagementModule],
  controllers: [AnalyticsController, GovernanceController],
  providers: [AnalyticsService, AuditService, GovernanceService],
  exports: [AuditService],
})
export class GovernanceModule {}
