import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('assessment')
@UseGuards(JwtAuthGuard)
export class AssessmentController {
  constructor(private assessmentService: AssessmentService) { }

  @Get('profile')
  async getProfile(@Request() req) {
    return this.assessmentService.getProfile(req.user.id);
  }

  @Post('curriculum')
  async updateCurriculum(@Request() req, @Body('curriculum') curriculum: any) {
    return this.assessmentService.updateCurriculum(req.user.id, curriculum);
  }

  @Post('submit-quiz')
  async submitQuiz(
    @Request() req,
    @Body('answers') answers: any,
    @Body('timeSeconds') timeSeconds: number,
  ) {
    return this.assessmentService.submitQuiz(req.user.id, answers, timeSeconds);
  }

  @Post('evaluate-pattern')
  async evaluatePattern(
    @Request() req,
    @Body('problemId') problemId: string,
    @Body('selectedPattern') selectedPattern: string,
    @Body('justification') justification: string,
  ) {
    return this.assessmentService.evaluatePattern(req.user.id, problemId, selectedPattern, justification);
  }

  @Post('evaluate-approach')
  async evaluateApproach(
    @Request() req,
    @Body('problemId') problemId: string,
    @Body('timeComplexity') timeComplexity: string,
    @Body('spaceComplexity') spaceComplexity: string,
    @Body('pseudocode') pseudocode: string,
  ) {
    return this.assessmentService.evaluateApproach(
      req.user.id,
      problemId,
      timeComplexity,
      spaceComplexity,
      pseudocode
    );
  }

  @Post('coach-chat')
  async getCoachChatResponse(
    @Request() req,
    @Body('problemId') problemId: string,
    @Body('code') code: string,
    @Body('language') language: string,
    @Body('message') message: string,
    @Body('history') history: any[],
  ) {
    return this.assessmentService.getCoachChatResponse(req.user.id, problemId, code, language, message, history);
  }

  @Post('telemetry')
  async logTelemetry(
    @Request() req,
    @Body('problemId') problemId: string,
    @Body('eventType') eventType: string,
    @Body('eventData') eventData: any,
  ) {
    return this.assessmentService.saveTelemetry(req.user.id, problemId, eventType, eventData);
  }
}
