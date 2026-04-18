import { Controller, Post, Body, Param, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { RefineQuestionDto, AskAiDto, SurveyResponseDto, RecommendFacilitiesDto } from './ai.dto';
import { Knex } from 'knex';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    @Inject('KNEX_CONNECTION') private readonly knex: Knex
  ) {}

  @Post('refine')
  @ApiOperation({ summary: 'Refine a raw user question using guidelines and preferences' })
  async refine(@Body() dto: RefineQuestionDto) {
    let preferences = null;
    
    if (dto.userId && dto.userId !== 'string' && dto.userId.length > 10) {
      try {
        const user = await this.knex('users').where({ id: dto.userId }).first();
        preferences = user?.preferences;
      } catch (e) {
        console.warn('Invalid userId format, skipping preferences load');
      }
    }
    
    const refinedText = await this.aiService.refineQuestion(dto.question, preferences, dto.custom_guidelines);
    console.log('--- Controller Refine Result (Final):', refinedText);
    
    return { refined: refinedText };
  }

  @Post('ask')
  @ApiOperation({ summary: 'Ask a refined question to the LLM' })
  async ask(@Body() dto: AskAiDto) {
    const answer = await this.aiService.ask(dto.refined_question);
    return { answer };
  }

  @Post('process-survey/:userId')
  @ApiOperation({ summary: 'Process questionnaire and store preferences' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async processSurvey(@Param('userId') userId: string, @Body() dto: SurveyResponseDto) {
    const tags = await this.aiService.extractPreferences(dto.answers);
    
    await this.knex('users')
      .where({ id: userId })
      .update({
        preferences: JSON.stringify({ tags, last_survey: new Date().toISOString() })
      });

    return { success: true, tags };
  }

  @Post('recommend-facilities/:userId')
  @ApiOperation({ summary: 'Recommend physical facilities based on user preferences and candidates provided by frontend' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async recommendFacilities(@Param('userId') userId: string, @Body() dto: RecommendFacilitiesDto) {
    // 1. Get User preferences
    const user = await this.knex('users').where({ id: userId }).first();
    const userTags = user?.preferences?.tags || [];

    // 2. Use the candidates provided by the frontend (circle listing)
    const facilities = dto.candidates;

    // 3. Match using AI
    const recommendations = await this.aiService.matchFacilities(userTags, facilities);

    // 4. Join with original data
    const detailedRecommendations = recommendations.map(rec => {
      const facility = facilities.find(f => f.id === rec.id);
      return { ...facility, recommendation_reason: rec.reason };
    });

    return detailedRecommendations;
  }
}
