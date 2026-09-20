import { Module } from '@nestjs/common';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AssessmentController],
  providers: [AssessmentService, AiOrchestratorService],
  exports: [AssessmentService, AiOrchestratorService],
})
export class AssessmentModule {}
