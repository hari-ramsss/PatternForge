import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProblemsModule } from './problems/problems.module';
import { BullModule } from '@nestjs/bullmq';
import { ExecutionModule } from './execution/execution.module';
import { AssessmentModule } from './assessment/assessment.module';

import { CardsModule } from './cards/cards.module';
import { MistakesModule } from './mistakes/mistakes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    ProblemsModule,
    ExecutionModule,
    AssessmentModule,
    CardsModule,
    MistakesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
