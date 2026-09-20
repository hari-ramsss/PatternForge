import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { CodeSanitizer } from './code-sanitizer';

@Injectable()
export class ExecutionService implements OnModuleInit {
  public readonly eventEmitter = new EventEmitter();
  private redisClient: Redis;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @InjectQueue('compile-queue') private compileQueue: Queue,
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.redisClient = new Redis(redisUrl);
  }

  private async resolveProblemId(problemId: string): Promise<string> {
    if (!problemId) return '';
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(problemId)) {
      return problemId;
    }
    const allProblems = await this.prisma.problem.findMany({ select: { id: true, title: true } });
    const match = allProblems.find(
      (p) =>
        p.id.toLowerCase() === problemId.toLowerCase() ||
        p.title.toLowerCase() === problemId.toLowerCase() ||
        p.title.toLowerCase().replace(/\s+/g, '-') === problemId.toLowerCase()
    );
    return match ? match.id : problemId;
  }

  async execute(userId: string, problemId: string, language: string, code: string, isSubmit: boolean, customTestCases?: Array<{ input: string; expected?: string }>) {
    const resolvedProblemId = await this.resolveProblemId(problemId);

    // 0. Perform Code Security Sanitization Check
    const securityCheck = CodeSanitizer.validateCode(code, language);
    if (!securityCheck.isSafe) {
      throw new BadRequestException(`Security Alert: ${securityCheck.violationReason}`);
    }

    // 1. Validate payload size limit (64KB)
    const codeSizeInBytes = Buffer.byteLength(code, 'utf8');
    if (codeSizeInBytes > 64 * 1024) {
      throw new BadRequestException('Payload size exceeds 64KB limit');
    }

    // 2. Enforce Rate Limiting (max 10 requests per minute per user)
    const rateLimitKey = `ratelimit:${userId}`;
    const requestsCount = await this.redisClient.incr(rateLimitKey);
    if (requestsCount === 1) {
      await this.redisClient.expire(rateLimitKey, 60);
    }
    if (requestsCount > 10) {
      throw new BadRequestException('Rate limit exceeded. Max 10 submissions per minute.');
    }

    // 3. Verify Problem existence
    const problem = await this.prisma.problem.findUnique({
      where: { id: resolvedProblemId },
    });
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    // 4. Create database Submission record
    const submission = await this.prisma.submission.create({
      data: {
        userId,
        problemId: resolvedProblemId,
        language,
        code,
        status: 'PENDING',
      },
    });

    // 5. Enqueue compile job
    try {
      await this.compileQueue.add('compile-job', {
        submissionId: submission.id,
        isSubmit,
        customTestCases,
      });
    } catch (err) {
      console.error('Failed to add compile job to queue:', err);
      // Rollback status to failed if queue addition fails
      await this.prisma.submission.update({
        where: { id: submission.id },
        data: { status: 'COMPILATION_ERROR', stderr: 'Queue connection failure' },
      });
      throw new InternalServerErrorException('Execution pipeline queue failure');
    }

    return {
      submissionId: submission.id,
      status: submission.status,
    };
  }

  async getDraft(userId: string, problemId: string, language: string) {
    const resolvedProblemId = await this.resolveProblemId(problemId);
    const cacheKey = `draft:${userId}:${resolvedProblemId}:${language}`;
    // Try to get from Redis cache first
    const cachedCode = await this.redisClient.get(cacheKey);
    if (cachedCode) {
      return { code: cachedCode };
    }

    // Fallback to PostgreSQL
    const draft = await this.prisma.codeDraft.findUnique({
      where: {
        userId_problemId_language: { userId, problemId: resolvedProblemId, language },
      },
    });

    if (draft) {
      return { code: draft.code };
    }

    // Fallback to starter boilerplate code
    const starter = await this.prisma.starterCode.findUnique({
      where: {
        problemId_language: { problemId: resolvedProblemId, language },
      },
    });

    return { code: starter?.boilerplate || '' };
  }

  async saveDraft(userId: string, problemId: string, language: string, code: string) {
    const resolvedProblemId = await this.resolveProblemId(problemId);
    const key = `draft:${userId}:${resolvedProblemId}:${language}`;
    await this.redisClient.set(key, code);

    // Only queue for Postgres persistence if resolvedProblemId exists in DB
    if (resolvedProblemId) {
      const exists = await this.prisma.problem.findUnique({
        where: { id: resolvedProblemId },
        select: { id: true },
      });
      if (exists) {
        await this.redisClient.sadd('dirty_drafts', key);
      }
    }
    return { success: true, savedLocally: true };
  }

  onModuleInit() {
    // Sync dirty drafts from Redis to PostgreSQL every 10 seconds
    setInterval(() => this.flushDirtyDraftsToDb(), 10000);
  }

  async flushDirtyDraftsToDb() {
    try {
      const dirtyKeys = await this.redisClient.spop('dirty_drafts', 100);
      if (!dirtyKeys || dirtyKeys.length === 0) return;

      const validProblems = await this.prisma.problem.findMany({ select: { id: true } });
      const validProblemIds = new Set(validProblems.map((p) => p.id));

      for (const key of dirtyKeys) {
        const parts = key.split(':');
        if (parts.length < 4) continue;
        const userId = parts[1];
        const resolvedProblemId = parts[2];
        const language = parts[3];

        if (!validProblemIds.has(resolvedProblemId)) {
          // Skip flushing drafts for non-existent database problems
          continue;
        }

        const code = await this.redisClient.get(key);
        if (code === null) continue;

        await this.prisma.codeDraft
          .upsert({
            where: {
              userId_problemId_language: { userId, problemId: resolvedProblemId, language },
            },
            update: { code },
            create: { userId, problemId: resolvedProblemId, language, code },
          })
          .catch((err) => {
            if (!err.message.includes('Foreign key constraint')) {
              this.redisClient.sadd('dirty_drafts', key);
            }
          });
      }
    } catch (err: any) {
      console.error('Error flushing dirty drafts to DB:', err.message);
    }
  }
}
