import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { RefineQuestionDto, AskAiDto } from './ai.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('refine')
  @ApiOperation({ summary: 'Refine a raw user question' })
  async refine(@Body() dto: RefineQuestionDto) {
    const refined = await this.aiService.refineQuestion(dto.question);
    return { refined };
  }

  @Post('ask')
  @ApiOperation({ summary: 'Ask a refined question to the LLM' })
  async ask(@Body() dto: AskAiDto) {
    const answer = await this.aiService.ask(dto.refined_question);
    return { answer };
  }
}
