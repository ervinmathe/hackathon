import { ApiProperty } from '@nestjs/swagger';

export class RefineQuestionDto {
  @ApiProperty({
    example: 'Hogyan tudnék jobban aludni vizsgaidőszakban?',
    description: 'A felhasználó nyers kérdése',
  })
  question: string;
}

export class AskAiDto {
  @ApiProperty({
    example: 'Finomított kérdés: Tudományos alvásjavító technikák egyetemi hallgatóknak...',
    description: 'A finomított kérdés, amit az LLM válaszol meg',
  })
  refined_question: string;
}

export class SurveyResponseDto {
  @ApiProperty({
    example: {
      "q1": "Nem alszom jól",
      "q2": "Sokat szorongok a vizsgák miatt",
      "q3": "Szeretek jógázni"
    },
    description: 'A kérdőív válaszai objektumként'
  })
  answers: any;
}
