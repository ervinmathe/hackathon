import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, UpdateProfileDto } from './auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('universities')
  @ApiOperation({ summary: 'Get all selectable universities' })
  @ApiResponse({ status: 200, description: 'Return all universities.' })
  async getUniversities() {
    return this.authService.getUniversities();
  }

  @Get('universities/:id/enrollments')
  @ApiOperation({ summary: 'Get enrollments for a specific university' })
  @ApiParam({ name: 'id', description: 'University ID' })
  @ApiResponse({ status: 200, description: 'Return enrollments for the university.' })
  async getEnrollmentsByUniversity(@Param('id') id: string) {
    return this.authService.getEnrollmentsByUniversity(id);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'The user has been successfully created.' })
  @ApiResponse({ status: 409, description: 'Conflict: Username or email already exists.' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid credentials.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'User successfully logged out.' })
  async logout() {
    return { message: 'Logged out' };
  }

  @Post('profile/:id')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  async updateProfile(@Param('id') id: string, @Body() updateDto: UpdateProfileDto) {
    return this.authService.updateProfile(id, updateDto);
  }
}
