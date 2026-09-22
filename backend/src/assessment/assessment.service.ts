import { BadGatewayException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AssessmentService implements OnModuleInit {
  private redisClient: Redis;

  constructor(
    private prisma: PrismaService,
    private aiOrchestrator: AiOrchestratorService,
    private configService: ConfigService,
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.redisClient = new Redis(redisUrl);
  }

  async getProfile(userId: string) {
    let profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.userProfile.create({
        data: { userId },
      });
    }

    return profile;
  }

  async updateCurriculum(userId: string, curriculum: any) {
    const profile = await this.getProfile(userId);
    const existing = this.curriculumRecord(profile.customCurriculum);
    return this.prisma.userProfile.update({
      where: { id: profile.id },
      data: { customCurriculum: { ...existing, curriculum } },
    });
  }

  private curriculumRecord(value: unknown): Record<string, any> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
  }

  async submitQuiz(userId: string, answers: any, timeSeconds: number) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    // Initialize scores
    let patternScore = 0;
    let observationScore = 0;
    let optimizationScore = 0;

    // 1. Evaluate Q1 & Q2 (Pattern Recognition)
    if (answers.q1 === 'prefix-sum') patternScore += 50;
    if (answers.q2 === 'sliding-window') patternScore += 50;

    // 2. Evaluate Q3 & Q5 (Observation Quality)
    // Q3 correct is checked items [1, 2]
    const q3Answers = answers.q3 || [];
    const hasQ3Val1 = q3Answers.includes(1);
    const hasQ3Val2 = q3Answers.includes(2);
    const hasQ3Others = q3Answers.some((val: number) => val !== 1 && val !== 2);
    if (hasQ3Val1 && hasQ3Val2 && !hasQ3Others) {
      observationScore += 50;
    } else if (hasQ3Val1 || hasQ3Val2) {
      observationScore += 25;
    }

    // Q5 correct is checked items [1, 3]
    const q5Answers = answers.q5 || [];
    const hasQ5Val1 = q5Answers.includes(1);
    const hasQ5Val3 = q5Answers.includes(3);
    const hasQ5Others = q5Answers.some((val: number) => val !== 1 && val !== 3);
    if (hasQ5Val1 && hasQ5Val3 && !hasQ5Others) {
      observationScore += 50;
    } else if (hasQ5Val1 || hasQ5Val3) {
      observationScore += 25;
    }

    // 3. Evaluate Q4 & Q6 (Optimization/Complexity)
    if (answers.q4 === 'O(N^2)') optimizationScore += 50;
    if (answers.q6 === 'O(log N)') optimizationScore += 50;

    // 4. Calculate Speed (Lower time = Higher score)
    // Standard expectation: 120 seconds. Minimum 10, Maximum 100.
    const speedScore = Math.max(10, Math.min(100, Math.floor(100 - (timeSeconds / 180) * 80)));

    // 5. Derived metrics
    const formulaScore = Math.floor((patternScore + optimizationScore) / 2);
    const consistencyScore = Math.floor((patternScore + observationScore + optimizationScore) / 3);

    // 6. Generate dynamic AI Mentor review text based on lowest score
    let mentorBrief = '';
    const scores = [
      { name: 'Pattern Recognition', val: patternScore },
      { name: 'Observation Quality', val: observationScore },
      { name: 'Optimization Ability', val: optimizationScore },
    ];
    scores.sort((a, b) => a.val - b.val);
    const lowest = scores[0];

    if (lowest.name === 'Observation Quality') {
      mentorBrief = `Hey there, your pattern selection is high (${patternScore}%), but your edge-case observation quality is low (${observationScore}%). You tend to start coding before analyzing edge invariants, negative bounds, or list lengths. We have adjusted your roadmap to prioritize structural observation checklists.`;
    } else if (lowest.name === 'Optimization Ability') {
      mentorBrief = `Hey there, you have strong logic for detecting patterns, but struggle with time complexity math and selecting optimal loop strides (${optimizationScore}%). We will focus on time complexity sliders and sorting-based optimizations.`;
    } else if (lowest.name === 'Pattern Recognition') {
      mentorBrief = `Hey there, you are good at analyzing edge constraints, but struggle to map raw I/O pairs to standard patterns (${patternScore}%). We will prioritize pattern matching decks and template recognition practices in your learning plan.`;
    } else {
      mentorBrief = `Hey there, you have a balanced baseline profile! Your speed (${speedScore}%) and consistency are strong. We will focus on advanced optimization and edge-case invariants to push you towards top product company coding standards.`;
    }

    // Update database profile
    return this.prisma.userProfile.update({
      where: { userId },
      data: {
        onboarded: true,
        scorePattern: patternScore,
        scoreObservation: observationScore,
        scoreFormula: formulaScore,
        scoreOptimization: optimizationScore,
        scoreSpeed: speedScore,
        scoreConsistency: consistencyScore,
        quizTimeSeconds: timeSeconds,
        mentorBrief,
      },
    });
  }

  async evaluatePattern(userId: string, problemId: string, selectedPattern: string, justification: string) {
    const problem = await this.resolveProblem(problemId);
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    if (!justification || justification.trim().length < 15) {
      return {
        success: false,
        feedback: 'Justification is too short. Explain in at least 15 characters (2-4 sentences) why this pattern applies.',
      };
    }

    const topic = problem.topic.toLowerCase();
    const pattern = selectedPattern.toLowerCase();
    let isCorrect = false;

    if (pattern.includes('array') && topic.includes('array')) isCorrect = true;
    else if (pattern.includes('pointer') && topic.includes('pointer')) isCorrect = true;
    else if (pattern.includes('window') && topic.includes('window')) isCorrect = true;
    else if (pattern.includes('heap') && topic.includes('heap')) isCorrect = true;
    else if (pattern.includes('priority') && topic.includes('heap')) isCorrect = true;
    else if (topic.includes(pattern) || pattern.includes(topic)) isCorrect = true;

    if (isCorrect) {
      // Reward profile pattern score slightly
      await this.prisma.userProfile.update({
        where: { userId },
        data: {
          scorePattern: { increment: 2 }
        }
      }).catch(() => {});

      return {
        success: true,
        feedback: 'Excellent! Your conceptual hypothesis matches. Let\'s proceed to observation training.',
        correctPattern: problem.topic,
      };
    } else {
      return {
        success: false,
        feedback: `Incorrect pattern matching. Hint: Carefully examine the input formats and search boundaries.`,
      };
    }
  }

  async evaluateObservations(userId: string, problemId: string, constraints: string, edgeCases: string, invariants: string) {
    const problem = await this.resolveProblem(problemId);
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    if (
      !constraints || constraints.trim().length < 15 ||
      !edgeCases || edgeCases.trim().length < 15 ||
      !invariants || invariants.trim().length < 15
    ) {
      return {
        success: false,
        feedback: 'Please fill out all observation textareas with at least 15 characters.',
      };
    }

    const result = await this.aiOrchestrator.evaluateObservations(problem, constraints, edgeCases, invariants);

    if (result.success) {
      // Reward profile observation score slightly
      await this.prisma.userProfile.update({
        where: { userId },
        data: {
          scoreObservation: { increment: 3 }
        }
      }).catch(() => {});
    }

    return result;
  }

  async evaluateApproach(
    userId: string,
    problemId: string,
    timeComplexity: string,
    spaceComplexity: string,
    pseudocode: string
  ) {
    const problem = await this.resolveProblem(problemId);
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    if (!timeComplexity || !spaceComplexity || !pseudocode || pseudocode.trim().length < 15) {
      return {
        success: false,
        feedback: 'Please fill out your pseudocode description with at least 15 characters.',
      };
    }

    const result = await this.aiOrchestrator.evaluateApproach(
      problem,
      timeComplexity,
      spaceComplexity,
      pseudocode
    );

    return result;
  }

  async getCodeHelp(userId: string, problemId: string, code: string, language: string) {
    const problem = await this.resolveProblem(problemId);
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }
    return this.aiOrchestrator.getCodeHelp(problem, code, language);
  }

  async evaluateCode(
    userId: string,
    problemId: string,
    code: string,
    language: string,
    status: string,
    errors: string
  ) {
    const problem = await this.resolveProblem(problemId);
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    const review = await this.aiOrchestrator.evaluateCode(problem, code, language, status, errors);

    if (review.passed && status === 'ACCEPTED') {
      // Reward user profile analytics for a fully correct implementation!
      await this.prisma.userProfile.update({
        where: { userId },
        data: {
          scoreConsistency: { increment: 3 },
          scoreOptimization: { increment: 3 },
          scorePattern: { increment: 3 }
        }
      }).catch(() => {});
    }

    return review;
  }

  async getCoachChatResponse(
    userId: string,
    problemId: string,
    code: string,
    language: string,
    message: string,
    history: any[]
  ) {
    const problem = await this.resolveProblem(problemId);
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }
    return this.aiOrchestrator.getCoachChatResponse(problem, code, language, message, history);
  }

  private async resolveProblem(problemId: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(problemId)) {
      return this.prisma.problem.findUnique({
        where: { id: problemId },
      });
    }
    const all = await this.prisma.problem.findMany();
    return all.find(
      (p) => p.title.toLowerCase().replace(/\s+/g, '-') === problemId.toLowerCase()
    );
  }

  onModuleInit() {
    // Sync telemetry event logs from Redis to PostgreSQL every 10 seconds
    setInterval(() => this.flushTelemetryLogsToDb(), 10000);
  }

  async saveTelemetry(userId: string, problemId: string, eventType: string, eventData: any) {
    const problem = await this.resolveProblem(problemId);
    const resolvedProblemId = problem?.id || problemId;

    const logEvent = {
      userId,
      problemId: resolvedProblemId,
      eventType,
      eventData: typeof eventData === 'string' ? eventData : JSON.stringify(eventData),
      createdAt: new Date().toISOString()
    };

    await this.redisClient.rpush('telemetry_buffer', JSON.stringify(logEvent));
    return { success: true };
  }

  async flushTelemetryLogsToDb() {
    try {
      const rawLogs = await this.redisClient.lpop('telemetry_buffer', 100);
      if (!rawLogs || rawLogs.length === 0) return;

      const telemetryLogsData = rawLogs.map((r) => JSON.parse(r));

      await this.prisma.telemetryLog.createMany({
        data: telemetryLogsData.map((log) => ({
          userId: log.userId,
          problemId: log.problemId,
          eventType: log.eventType,
          eventData: log.eventData,
          createdAt: new Date(log.createdAt)
        }))
      });
    } catch (err: any) {
      console.error('Error during background telemetry logs flush:', err.message);
    }
  }
}
