import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('refine')
  @ApiOperation({ summary: 'Refine a raw user question' })
  async refine(@Body('question') question: string) {
    const refined = await this.aiService.refineQuestion(question);
    return { refined };
  }

  @Post('ask')
  @ApiOperation({ summary: 'Ask a refined question to the LLM' })
  async ask(@Body('refined_question') refinedQuestion: string) {
    const answer = await this.aiService.ask(refinedQuestion);
    return { answer };
  }
}
