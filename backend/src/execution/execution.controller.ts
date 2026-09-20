import { Controller, Post, Get, Body, Param, Sse, MessageEvent, UseGuards, Request, Query } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Observable } from 'rxjs';

@Controller('playground')
export class ExecutionController {
  constructor(private executionService: ExecutionService) {}

  @UseGuards(JwtAuthGuard)
  @Post('execute')
  async execute(
    @Request() req,
    @Body('problemId') problemId: string,
    @Body('language') language: string,
    @Body('code') code: string,
    @Body('isSubmit') isSubmit: boolean,
    @Body('customTestCases') customTestCases?: Array<{ input: string; expected?: string }>,
  ) {
    return this.executionService.execute(req.user.id, problemId, language, code, isSubmit, customTestCases);
  }

  @UseGuards(JwtAuthGuard)
  @Post('autosave')
  async autosave(
    @Request() req,
    @Body('problemId') problemId: string,
    @Body('language') language: string,
    @Body('code') code: string,
  ) {
    return this.executionService.saveDraft(req.user.id, problemId, language, code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('draft/:problemId')
  async getDraft(
    @Request() req,
    @Param('problemId') problemId: string,
    @Query('language') language: string,
  ) {
    return this.executionService.getDraft(req.user.id, problemId, language);
  }

  @Sse('execute/:id/stream')
  streamExecution(@Param('id') submissionId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((observer) => {
      observer.next({ data: { status: 'PENDING' } });

      const listener = (data: any) => {
        observer.next({ data });
        if (
          data.status === 'ACCEPTED' ||
          data.status === 'WRONG_ANSWER' ||
          data.status === 'TIME_LIMIT_EXCEEDED' ||
          data.status === 'MEMORY_LIMIT_EXCEEDED' ||
          data.status === 'COMPILATION_ERROR' ||
          data.status === 'RUNTIME_ERROR'
        ) {
          observer.complete();
        }
      };

      this.executionService.eventEmitter.on(`status:${submissionId}`, listener);

      return () => {
        this.executionService.eventEmitter.off(`status:${submissionId}`, listener);
      };
    });
  }
}
