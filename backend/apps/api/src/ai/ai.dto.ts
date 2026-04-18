import { ApiProperty } from '@nestjs/swagger';

export class RefineQuestionDto {
  @ApiProperty({
    example: 'Hogyan tudnék jobban aludni vizsgaidőszakban?',
    description: 'A felhasználó által megfogalmazott nyers kérdés.',
  })
  question: string;

  @ApiProperty({
    required: false,
    example: '26fcccfc-c654-4f79-ab4d-eb3bab3df311',
    description: 'Opcionális: Felhasználó UUID-ja a preferenciák szerinti finomításhoz.'
  })
  userId?: string;

  @ApiProperty({
    required: false,
    example: 'A válasz legyen rövid, tagolt és tartalmazzon egy tippet a fizikai aktivitáshoz is.',
    description: 'Egyedi irányelvek, amelyekkel felülbírálhatod a rendszer alapértelmezett viselkedését.'
  })
  custom_guidelines?: string;
}

export class AskAiDto {
  @ApiProperty({
    example: 'Tudományos alvásjavító technikák egyetemi hallgatóknak vizsgaidőszakban.',
    description: 'A finomított kérdés, amelyet az AI megválaszol.',
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
    description: 'Kérdőív válaszai kulcs-érték párokban.'
  })
  answers: any;
}

export class FacilityDataDto {
  @ApiProperty({ example: 'uuid-1234' })
  id: string;
  @ApiProperty({ example: 'Szigeti Fitness' })
  name: string;
  @ApiProperty({ example: ['konditerem', 'edzés', 'fizikai-aktivitás'] })
  tags: string[];
  @ApiProperty({ example: 'Modern konditerem az egyetem mellett.', required: false })
  description?: string;
}

export class RecommendFacilitiesDto {
  @ApiProperty({ 
    type: [FacilityDataDto],
    description: 'A környéken található létesítmények listája rangsoroláshoz.'
  })
  candidates: FacilityDataDto[];
}
