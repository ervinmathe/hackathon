import { ApiProperty } from '@nestjs/swagger';

export class RefineQuestionDto {
  @ApiProperty({
    example: 'Hogyan tudnék jobban aludni vizsgaidőszakban?',
    description: 'A felhasználó nyers kérdése',
  })
  question: string;

  @ApiProperty({
    required: false,
    description: 'Opcionális: Felhasználó ID-ja a preferenciák betöltéséhez'
  })
  userId?: string;

  @ApiProperty({
    required: false,
    example: 'A válasz legyen rövid és tartalmazzon egy tippet a fizikai aktivitáshoz is.',
    description: 'Egyedi irányelvek a finomításhoz'
  })
  custom_guidelines?: string;
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

export class FacilityDataDto {
  @ApiProperty({ example: 'uuid-1' })
  id: string;
  @ApiProperty({ example: 'Szigeti Fitness' })
  name: string;
  @ApiProperty({ example: ['konditerem', 'edzés', 'fizikai-aktivitás'] })
  tags: string[];
  @ApiProperty({ example: 'Modern konditerem az egyetem mellett.', required: false })
  description?: string;
}

export class RecommendFacilitiesDto {
  @ApiProperty({ type: [FacilityDataDto] })
  candidates: FacilityDataDto[];
}
