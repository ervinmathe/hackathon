import { ApiProperty } from '@nestjs/swagger';

export class CreateUniversityDto {
  @ApiProperty({ example: 'Eötvös Loránd Tudományegyetem' })
  name: string;
  @ApiProperty({ example: 'ELTE Budapest', required: false })
  description?: string;
}

export class CreateEnrollmentDto {
  @ApiProperty({ example: 'Programtervező Informatikus' })
  name: string;
  @ApiProperty({ example: 'Alapképzés (BSc)', required: false })
  description?: string;
  @ApiProperty({ example: 'uni-uuid-here' })
  university_id: string;
}

export class UpdateEnrollmentDto {
  @ApiProperty({ required: false })
  name?: string;
  @ApiProperty({ required: false })
  description?: string;
  @ApiProperty({ required: false })
  university_id?: string;
}

export class CreateForumDto {
  @ApiProperty({ example: 'Analízis 1' })
  name: string;
  @ApiProperty({ example: 'Matematikai alapok', required: false })
  description?: string;
  @ApiProperty({ example: 'enrollment-uuid-here' })
  enrollment_id: string;
  @ApiProperty({ example: 'uni-uuid-here' })
  university_id: string;
}

export class UpdateForumDto {
  @ApiProperty({ required: false })
  name?: string;
  @ApiProperty({ required: false })
  description?: string;
  @ApiProperty({ required: false })
  enrollment_id?: string;
  @ApiProperty({ required: false })
  university_id?: string;
}

export class CreateUserDto {
  @ApiProperty({ example: 'admin_user' })
  username: string;
  @ApiProperty({ example: 'admin@wellpath.com' })
  email: string;
  @ApiProperty({ example: 'strongpassword' })
  password: string;
  @ApiProperty({ example: 'ADMIN', enum: ['ADMIN', 'LESSADMIN', 'USER'] })
  role: string;
  @ApiProperty({ example: 'uni-uuid-here' })
  university_id: string;
  @ApiProperty({ example: 'enrollment-uuid-here', required: false })
  enrollment_id?: string;
  @ApiProperty({ example: 1, required: false })
  year?: number;
}
