import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { MistakesService, OaEvaluationInput } from './mistakes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('mistakes')
@UseGuards(JwtAuthGuard)
export class MistakesController {
  constructor(private readonly mistakesService: MistakesService) {}

  @Post('evaluate-oa')
  async evaluateOa(@Request() req, @Body() body: OaEvaluationInput) {
    return this.mistakesService.evaluateOaSubmission(req.user.id, body);
  }

  @Get('analytics')
  async getAnalytics(@Request() req) {
    return this.mistakesService.getMistakeAnalytics(req.user.id);
  }
}
