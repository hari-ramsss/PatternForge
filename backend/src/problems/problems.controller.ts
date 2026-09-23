import { Controller, Get, Param, Post, Delete, Body, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { LeetcodeSyncService } from './leetcode-sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('problems')
export class ProblemsController {
  constructor(
    private problemsService: ProblemsService,
    private leetcodeSyncService: LeetcodeSyncService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req) {
    return this.problemsService.findAll(req.user.id);
  }

  @Get('curriculum/subtopics')
  async getCurriculum() {
    return this.problemsService.getCurriculum();
  }

  @UseGuards(JwtAuthGuard)
  @Post('sync/:slug')
  async syncProblem(@Param('slug') slug: string) {
    return this.leetcodeSyncService.syncProblem(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Post('ai-create')
  async aiCreateProblem(
    @Request() req,
    @Body('prompt') prompt: string,
    @Body('pattern') pattern?: string,
    @Body('subtopic') subtopic?: string,
  ) {
    return this.problemsService.createProblemWithAi(prompt, pattern, subtopic);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.problemsService.findOne(id);
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;

      try {
        return await this.leetcodeSyncService.syncProblem(id);
      } catch {
        throw error;
      }
    }
  }

  @Get(':id/diagrams')
  async findDiagrams(@Param('id') id: string) {
    return this.problemsService.findVisualDiagrams(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/diagrams')
  async saveDiagram(@Param('id') id: string, @Body() body: {
    exampleId: string;
    kind: string;
    label: string;
    mermaid: string;
    visualData?: Record<string, unknown>;
  }) {
    return this.problemsService.saveVisualDiagram(id, body);
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: string) {
    return this.problemsService.deleteProblem(id);
  }
}
