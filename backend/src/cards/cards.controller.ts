import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CardsService } from './cards.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cards')
@UseGuards(JwtAuthGuard)
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  async getCards(@Request() req, @Query('filter') filter?: string) {
    return this.cardsService.getUserCards(req.user.id, filter);
  }

  @Post()
  async createCard(
    @Request() req,
    @Body() body: {
      problemId?: string;
      problemTitle: string;
      patternName: string;
      clues: string;
      invariants: string;
      codeSnippet: string;
      optimalTime?: string;
      optimalSpace?: string;
    },
  ) {
    return this.cardsService.createCard(req.user.id, body);
  }

  @Post(':id/review')
  async reviewCard(
    @Request() req,
    @Param('id') id: string,
    @Body('rating') rating: number,
  ) {
    return this.cardsService.reviewCard(req.user.id, id, rating);
  }
}
