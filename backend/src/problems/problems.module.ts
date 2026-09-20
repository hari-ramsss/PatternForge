import { Module } from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { ProblemsController } from './problems.controller';
import { LeetcodeSyncService } from './leetcode-sync.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AssessmentModule } from '../assessment/assessment.module';

@Module({
  imports: [PrismaModule, AssessmentModule],
  providers: [ProblemsService, LeetcodeSyncService],
  controllers: [ProblemsController],
  exports: [ProblemsService, LeetcodeSyncService],
})
export class ProblemsModule {}
