import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ExecutionService } from './execution.service';
import { ExecutionController } from './execution.controller';
import { ExecutionProcessor } from './execution.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AssessmentModule } from '../assessment/assessment.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    AssessmentModule,
    BullModule.registerQueue({
      name: 'compile-queue',
    }),
  ],
  providers: [ExecutionService, ExecutionProcessor],
  controllers: [ExecutionController],
  exports: [ExecutionService],
})
export class ExecutionModule {}
