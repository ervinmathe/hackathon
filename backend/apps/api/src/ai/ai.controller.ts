import { Controller, Post, Body, Param, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { RefineQuestionDto, AskAiDto, SurveyResponseDto } from './ai.dto';
import { Knex } from 'knex';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    @Inject('KNEX_CONNECTION') private readonly knex: Knex
  ) {}

  @Post('refine')
  @ApiOperation({ summary: 'Refine a raw user question using guidelines' })
  async refine(@Body() dto: RefineQuestionDto) {
    const refined = await this.aiService.refineQuestion(dto.question);
    return { refined };
  }

  @Post('ask')
  @ApiOperation({ summary: 'Ask a refined question to the LLM using guidelines' })
  async ask(@Body() dto: AskAiDto) {
    const answer = await this.aiService.ask(dto.refined_question);
    return { answer };
  }

  @Post('process-survey/:userId')
  @ApiOperation({ summary: 'Process questionnaire and store preferences' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async processSurvey(@Param('userId') userId: string, @Body() dto: SurveyResponseDto) {
    // 1. Extract keywords via AI
    const tags = await this.aiService.extractPreferences(dto.answers);
    
    // 2. Save to DB (preferences field)
    await this.knex('users')
      .where({ id: userId })
      .update({
        preferences: JSON.stringify({ tags, last_survey: new Date().toISOString() })
      });

    return { success: true, tags };
  }
}
