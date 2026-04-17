import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CmsService } from './cms.service';

@ApiTags('admin')
@Controller('admin')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  // --- Enrollments (Szakok) ---
  @Get('enrollments')
  @ApiOperation({ summary: 'Admin: List all enrollments' })
  async getAllEnrollments() {
    return this.cmsService.getAllEnrollments();
  }

  @Post('enrollments')
  @ApiOperation({ summary: 'Admin: Create a new enrollment' })
  async createEnrollment(@Body() data: { name: string; description?: string }) {
    return this.cmsService.createEnrollment(data);
  }

  @Patch('enrollments/:id')
  @ApiOperation({ summary: 'Admin: Update an enrollment' })
  async updateEnrollment(@Param('id') id: string, @Body() data: { name?: string; description?: string }) {
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
  @ApiOperation({ summary: 'Admin: Create a new forum for a subject' })
  async createForum(@Body() data: { name: string; description?: string; enrollment_id: string }) {
    return this.cmsService.createForum(data);
  }

  @Patch('forums/:id')
  @ApiOperation({ summary: 'Admin: Update a forum' })
  async updateForum(@Param('id') id: string, @Body() data: { name?: string; description?: string; enrollment_id?: string }) {
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

  @Delete('users/:id')
  @ApiOperation({ summary: 'Admin: Delete a user' })
  async deleteUser(@Param('id') id: string) {
    return this.cmsService.deleteUser(id);
  }

  // --- Posts ---
  @Get('posts')
  @ApiOperation({ summary: 'Admin: List all posts' })
  async getAllPosts() {
    return this.cmsService.getAllPosts();
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Admin: Delete a post' })
  async deletePost(@Param('id') id: string) {
    return this.cmsService.deletePost(id);
  }
}
