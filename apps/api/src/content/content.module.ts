import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { DraftsController } from './drafts.controller';
import { DraftTeamsController } from './draft-teams.controller';
import { DraftsService } from './drafts.service';
import { EngagementModule } from '../engagement/engagement.module';
import { GovernanceModule } from '../governance/governance.module';

@Module({
  imports: [AuthModule, EngagementModule, GovernanceModule],
  controllers: [ContentController, DraftsController, DraftTeamsController],
  providers: [ContentService, DraftsService],
})
export class ContentModule {}
