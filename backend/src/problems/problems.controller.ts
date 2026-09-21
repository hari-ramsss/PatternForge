import { Controller, Get, Param, Post, Delete, Body, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { LeetcodeSyncService } from './leetcode-sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('problems')
export class ProblemsController {
  constructor(
    private problemsService: ProblemsService,
    private leetcodeSyncService: LeetcodeSyncService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req) {
    return this.problemsService.findAll(req.user.id);
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

  @Delete(':id')
  async deleteOne(@Param('id') id: string) {
    return this.problemsService.deleteProblem(id);
  }
}
