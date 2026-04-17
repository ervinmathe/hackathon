import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('enrollments')
  @ApiOperation({ summary: 'Get all selectable enrollments (majors)' })
  @ApiResponse({ status: 200, description: 'Return all enrollments.' })
  async getEnrollments() {
    return this.authService.getEnrollments();
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'The user has been successfully created.' })
  @ApiResponse({ status: 409, description: 'Conflict: Username or email already exists.' })
  async register(@Body() registerDto: any) {
    return this.authService.register(registerDto);
  }
}
