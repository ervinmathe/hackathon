import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CmsService } from './cms.service';

@ApiTags('admin')
@Controller('admin')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  // --- Universities ---
  @Get('universities')
  @ApiOperation({ summary: 'Admin: List all universities' })
  async getAllUniversities() {
    return this.cmsService.getAllUniversities();
  }

  @Post('universities')
  @ApiOperation({ summary: 'Admin: Create a new university' })
  async createUniversity(@Body() data: { name: string; description?: string }) {
    return this.cmsService.createUniversity(data);
  }

  @Delete('universities/:id')
  @ApiOperation({ summary: 'Admin: Delete a university' })
  async deleteUniversity(@Param('id') id: string) {
    return this.cmsService.deleteUniversity(id);
  }

  // --- Enrollments (Szakok) ---
  @Get('enrollments')
  @ApiOperation({ summary: 'Admin: List all enrollments' })
  async getAllEnrollments() {
    return this.cmsService.getAllEnrollments();
  }

  @Post('enrollments')
  @ApiOperation({ summary: 'Admin: Create a new enrollment' })
  async createEnrollment(@Body() data: { name: string; description?: string; university_id: string }) {
    return this.cmsService.createEnrollment(data);
  }

  @Patch('enrollments/:id')
  @ApiOperation({ summary: 'Admin: Update an enrollment' })
  async updateEnrollment(@Param('id') id: string, @Body() data: { name?: string; description?: string; university_id?: string }) {
    return this.cmsService.updateEnrollment(id, data);
  }

  @Delete('enrollments/:id')
  @ApiOperation({ summary: 'Admin: Delete an enrollment' })
  async deleteEnrollment(@Param('id') id: string) {
    return this.cmsService.deleteEnrollment(id);
  }

  // --- Forums (Subjects) ---
  @Get('forums')
  @ApiOperation({ summary: 'Admin: List all forums' })
  async getAllForums() {
    return this.cmsService.getAllForums();
  }

  @Post('forums')
  @ApiOperation({ summary: 'Admin: Create a new forum' })
  async createForum(@Body() data: { name: string; description?: string; enrollment_id: string; university_id: string }) {
    return this.cmsService.createForum(data);
  }

  @Patch('forums/:id')
  @ApiOperation({ summary: 'Admin: Update a forum' })
  async updateForum(@Param('id') id: string, @Body() data: { name?: string; description?: string; enrollment_id?: string; university_id?: string }) {
    return this.cmsService.updateForum(id, data);
  }

  @Delete('forums/:id')
  @ApiOperation({ summary: 'Admin: Delete a forum' })
  async deleteForum(@Param('id') id: string) {
    return this.cmsService.deleteForum(id);
  }

  // --- Users Management ---
  @Get('users')
  @ApiOperation({ summary: 'Admin: List all users' })
  async getAllUsers() {
    return this.cmsService.getAllUsers();
  }

  @Post('users')
  @ApiOperation({ summary: 'Admin: Create a new user (e.g. LESSADMIN)' })
  async createUser(@Body() data: { username: string; email: string; password: string; role: string; enrollment_id?: string; university_id: string; year?: number }) {
    return this.cmsService.createUser(data);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Admin: Delete a user' })
  async deleteUser(@Param('id') id: string) {
    return this.cmsService.deleteUser(id);
  }

  // --- Content Moderation ---
  @Get('posts')
  @ApiOperation({ summary: 'Admin: List all posts for moderation' })
  async getAllPosts() {
    return this.cmsService.getAllPosts();
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Admin: Delete a post' })
  async deletePost(@Param('id') id: string) {
    return this.cmsService.deletePost(id);
  }
}
