import { BadGatewayException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiOrchestratorService } from '../assessment/ai-orchestrator.service';

@Injectable()
export class ProblemsService {
  constructor(
    private prisma: PrismaService,
    private aiOrchestrator: AiOrchestratorService,
  ) { }

  async getCurriculum() {
    return this.prisma.curriculumSubtopic.findMany({
      orderBy: [{ topic: 'asc' }, { sortOrder: 'asc' }],
      select: {
        id: true,
        topic: true,
        title: true,
        sortOrder: true,
        canonicalSlug: true,
        canonicalTitle: true,
        problemAssignments: {
          orderBy: { sortOrder: 'asc' },
          select: {
            role: true,
            problem: { select: { id: true, title: true, difficulty: true } },
          },
        },
      },
    });
  }

  async findAll(userId?: string) {
    const problems = await this.prisma.problem.findMany({
      include: {
        submissions: {
          where: {
            userId: userId || '',
            status: 'ACCEPTED',
          },
          select: {
            id: true,
          },
        },
      },
    });

    return problems.map((p) => ({
      id: p.title.toLowerCase().replace(/\s+/g, '-'),
      title: p.title,
      difficulty: p.difficulty,
      optimalTime: p.optimalTime,
      optimalSpace: p.optimalSpace,
      topic: p.topic,
      subtopic: p.subtopic,
      solved: p.submissions.length > 0,
    }));
  }

  async findOne(id: string) {
    let problem: any = null;
    const requestedSlug = this.toProblemSlug(id);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) {
      problem = await this.prisma.problem.findUnique({
        where: { id },
        include: {
          examples: true,
          constraints: true,
          starterCodes: true,
          testCases: true,
          visualDiagrams: true,
        },
      });
    }

    if (!problem) {
      const allProblems = await this.prisma.problem.findMany({
        include: {
          examples: true,
          constraints: true,
          starterCodes: true,
          testCases: true,
          visualDiagrams: true,
        },
      });
      problem = allProblems.find((p) => this.toProblemSlug(p.title) === requestedSlug);
    }

    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    // On-Demand Auto-Seeding: Seed test cases if they are missing
    if (!problem.testCases || problem.testCases.length === 0) {
      const slug = problem.title.toLowerCase().replace(/\s+/g, '-');
      const seedCases = TEST_CASES_SEED[slug];
      if (seedCases) {
        await this.prisma.testCase.createMany({
          data: seedCases.map(c => ({
            problemId: problem.id,
            input: c.input,
            expected: c.expected,
            isPublic: c.isPublic
          }))
        }).catch(err => console.error('Failed to auto-seed test cases:', err));

        // Refetch test cases for the returning object
        problem.testCases = await this.prisma.testCase.findMany({
          where: { problemId: problem.id }
        });
      }
    }

    problem.description = this.cleanDescription(problem.description);
    return problem;
  }

  async findVisualDiagrams(id: string) {
    const problem = await this.resolveProblem(id);
    return this.prisma.problemVisualDiagram.findMany({
      where: { problemId: problem.id },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async saveVisualDiagram(id: string, data: {
    exampleId: string;
    kind: string;
    label: string;
    mermaid: string;
    visualData?: Record<string, unknown>;
  }) {
    const problem = await this.resolveProblem(id);
    const example = await this.prisma.problemExample.findFirst({
      where: { id: data.exampleId, problemId: problem.id },
    });
    if (!example) throw new NotFoundException('Example not found');
    const visualData = (data.visualData ?? {}) as Prisma.InputJsonValue;

    return this.prisma.problemVisualDiagram.upsert({
      where: { problemId_exampleId: { problemId: problem.id, exampleId: data.exampleId } },
      create: { problemId: problem.id, exampleId: data.exampleId, kind: data.kind, label: data.label, mermaid: data.mermaid, visualData },
      update: { kind: data.kind, label: data.label, mermaid: data.mermaid, visualData },
    });
  }

  private async resolveProblem(id: string) {
    const requestedSlug = this.toProblemSlug(id);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const byId = uuidRegex.test(id)
      ? await this.prisma.problem.findUnique({ where: { id } })
      : null;
    const problem = byId ?? (await this.prisma.problem.findFirst({
      where: { title: { equals: requestedSlug.replace(/-/g, ' '), mode: 'insensitive' } },
    }));
    if (!problem) throw new NotFoundException('Problem not found');
    return problem;
  }

  private toProblemSlug(value: string): string {
    return value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private cleanDescription(desc: string): string {
    if (!desc) return '';
    return desc
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&middot;/g, '·')
      .replace(/&deg;/g, '°')
      .replace(/&ge;/g, '≥')
      .replace(/&le;/g, '≤');
  }

  async createProblemWithAi(prompt: string, pattern?: string, subtopic?: string) {
    const curriculum = pattern && subtopic
      ? await this.prisma.curriculumSubtopic.findFirst({
        where: { topic: { equals: pattern, mode: 'insensitive' }, title: { equals: subtopic, mode: 'insensitive' } },
      })
      : null;
    const existingProblems = pattern && subtopic
      ? await this.prisma.problem.findMany({
        where: { topic: { equals: pattern, mode: 'insensitive' }, subtopic: { equals: subtopic, mode: 'insensitive' } },
        select: { title: true },
      })
      : [];
    const generationContract = `
CURRICULUM CONTRACT (must follow):
- Topic: ${pattern || 'Use the requested topic'}
- Subtopic: ${subtopic || 'Use the requested subtopic'}
- This must be a standalone LeetCode-style problem that directly tests this exact subtopic.
- Use a standard LeetCode problem title when a canonical title exists; do not invent a vague title.
- Do not repeat any previously generated title for this topic/subtopic: ${existingProblems.map((problem) => problem.title).join(', ') || 'None'}
- Return a meaningfully different problem, not a renamed copy of an existing one.
${curriculum?.canonicalTitle ? `- Canonical reference problem for this skill: ${curriculum.canonicalTitle} (${curriculum.canonicalSlug}). Use it as the concept anchor, then create a distinct practice problem.` : ''}`;
    let data: any;
    try {
      data = await this.aiOrchestrator.generateProblemDetails(`${prompt}\n${generationContract}`);
    } catch (error) {
      throw new BadGatewayException('AI generation did not return a problem. Nothing was saved.');
    }

    if (!data?.title || typeof data.title !== 'string') {
      throw new BadGatewayException('AI returned a problem without a valid title. Nothing was saved.');
    }
    const duplicate = existingProblems.some((problem) => problem.title.trim().toLowerCase() === data.title.trim().toLowerCase());
    if (duplicate) {
      throw new BadGatewayException('AI returned a problem that already exists for this subtopic. Please generate again.');
    }

    // 1. Create the Problem record
    const problem = await this.prisma.problem.create({
      data: {
        title: data.title,
        description: data.description,
        difficulty: data.difficulty || 'MEDIUM',
        topic: pattern || data.topic || 'arrays',
        subtopic: subtopic || null,
        timeLimit: data.timeLimit || 2.0,
        memoryLimit: data.memoryLimit || 256,
        optimalTime: data.optimalTime || 'O(N)',
        optimalSpace: data.optimalSpace || 'O(1)',
      }
    });

    if (pattern && subtopic) {
      const curriculumSubtopic = await this.prisma.curriculumSubtopic.findFirst({
        where: {
          topic: { equals: pattern, mode: 'insensitive' },
          title: { equals: subtopic, mode: 'insensitive' },
        },
      });
      if (curriculumSubtopic) {
        await this.prisma.curriculumProblemAssignment.create({
          data: {
            curriculumSubtopicId: curriculumSubtopic.id,
            problemId: problem.id,
            role: 'GENERATED',
            sortOrder: 1,
          },
        });
      }
    }

    // 2. Create examples
    if (data.examples && data.examples.length > 0) {
      await this.prisma.problemExample.createMany({
        data: data.examples.map(ex => ({
          problemId: problem.id,
          input: ex.input,
          output: ex.output,
          explanation: ex.explanation || null
        }))
      });
    }

    // 3. Create constraints
    if (data.constraints && data.constraints.length > 0) {
      await this.prisma.problemConstraint.createMany({
        data: data.constraints.map(c => ({
          problemId: problem.id,
          statement: typeof c === 'string' ? c : c.statement
        }))
      });
    }

    // 4. Create starter codes
    if (data.starterCodes && data.starterCodes.length > 0) {
      for (const sc of data.starterCodes) {
        await this.prisma.starterCode.create({
          data: {
            problemId: problem.id,
            language: sc.language,
            boilerplate: sc.boilerplate
          }
        }).catch(err => console.error('Failed to save starter code:', err.message));
      }
    }

    // 5. Create test cases (both public sample cases and private edge cases)
    if (data.testCases && data.testCases.length > 0) {
      await this.prisma.testCase.createMany({
        data: data.testCases.map(tc => ({
          problemId: problem.id,
          input: tc.input,
          expected: tc.expected,
          isPublic: tc.isPublic ?? false
        }))
      });
    }

    return {
      success: true,
      problemId: problem.id,
      problemTitle: problem.title,
      optimalTime: problem.optimalTime,
      optimalSpace: problem.optimalSpace,
      topic: problem.topic,
      subtopic: problem.subtopic,
      difficulty: problem.difficulty,
      generatedSpec: data
    };
  }

  async deleteProblem(id: string) {
    // Find problem by id, titleSlug, or title
    const problem = await this.prisma.problem.findFirst({
      where: {
        OR: [
          { id: id },
          { title: { equals: id, mode: 'insensitive' } },
          { title: { contains: id, mode: 'insensitive' } }
        ]
      }
    });

    if (!problem) {
      return { success: false, message: 'Problem not found' };
    }

    const realId = problem.id;

    // Delete dependent relations first
    await this.prisma.testCase.deleteMany({ where: { problemId: realId } });
    await this.prisma.starterCode.deleteMany({ where: { problemId: realId } });
    await this.prisma.problemExample.deleteMany({ where: { problemId: realId } });
    await this.prisma.problemConstraint.deleteMany({ where: { problemId: realId } });
    await this.prisma.codeDraft.deleteMany({ where: { problemId: realId } });
    await this.prisma.submission.deleteMany({ where: { problemId: realId } });
    await this.prisma.learningSession.deleteMany({ where: { problemId: realId } });

    // Delete problem
    await this.prisma.problem.delete({
      where: { id: realId }
    });

    return { success: true, deletedId: realId };
  }
}

const TEST_CASES_SEED: Record<string, Array<{ input: string; expected: string; isPublic: boolean }>> = {
  'valid-palindrome': [
    { input: '"A man, a plan, a canal: Panama"', expected: 'true', isPublic: true },
    { input: '"race a car"', expected: 'false', isPublic: true },
    { input: '" "', expected: 'true', isPublic: true },
    { input: '"ab_a"', expected: 'true', isPublic: false },
    { input: '"0P"', expected: 'false', isPublic: false }
  ],
  'top-k-frequent-elements': [
    { input: '[1,1,1,2,2,3]\n2', expected: '[1,2]', isPublic: true },
    { input: '[1]\n1', expected: '[1]', isPublic: true },
    { input: '[1,2]\n2', expected: '[1,2]', isPublic: false },
    { input: '[-1,-1]\n1', expected: '[-1]', isPublic: false },
    { input: '[4,1,-1,2,-1,2,3]\n2', expected: '[-1,2]', isPublic: false }
  ],
  'product-of-array-except-self': [
    { input: '[1,2,3,4]', expected: '[24,12,8,6]', isPublic: true },
    { input: '[-1,1,0,-3,3]', expected: '[0,0,9,0,0]', isPublic: true },
    { input: '[0,0]', expected: '[0,0]', isPublic: false },
    { input: '[1,2]', expected: '[2,1]', isPublic: false }
  ],
  'maximum-subarray': [
    { input: '[-2,1,-3,4,-1,2,1,-5,4]', expected: '6', isPublic: true },
    { input: '[1]', expected: '1', isPublic: true },
    { input: '[5,4,-1,7,8]', expected: '23', isPublic: true },
    { input: '[-1]', expected: '-1', isPublic: false },
    { input: '[-5,-4,-3,-2,-1]', expected: '-1', isPublic: false }
  ],
  'binary-search': [
    { input: '[-1,0,3,5,9,12]\n9', expected: '4', isPublic: true },
    { input: '[-1,0,3,5,9,12]\n2', expected: '-1', isPublic: true },
    { input: '[5]\n5', expected: '0', isPublic: false },
    { input: '[5]\n2', expected: '-1', isPublic: false }
  ]
};
