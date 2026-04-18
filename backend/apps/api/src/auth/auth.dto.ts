import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'johndoe' })
  username: string;
  @ApiProperty({ example: 'john@example.com' })
  email: string;
  @ApiProperty({ example: 'password123' })
  password: string;
  @ApiProperty({ example: 'uni-uuid-here' })
  university_id: string;
  @ApiProperty({ example: 'enrollment-uuid-here' })
  enrollment_id: string;
  @ApiProperty({ example: 1 })
  year: number;
}

export class LoginDto {
  @ApiProperty({ example: 'johndoe', required: false })
  username?: string;
  @ApiProperty({ example: 'john@example.com', required: false })
  email?: string;
  @ApiProperty({ example: 'password123' })
  password: string;
}

export class UpdateProfileDto {
  @ApiProperty({ example: 'newusername', required: false })
  username?: string;
  @ApiProperty({ example: 'new@email.com', required: false })
  email?: string;
  @ApiProperty({ example: 'newpassword', required: false })
  password?: string;
  @ApiProperty({ example: 'new-enrollment-id', required: false })
  enrollment_id?: string;
  @ApiProperty({ example: 2, required: false })
  year?: number;
  @ApiProperty({ example: 'https://supabase.com/avatar.png', required: false })
  profile_url?: string;
}
