import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CmsService } from './cms.service';
import { 
  CreateUniversityDto, 
  CreateEnrollmentDto, 
  UpdateEnrollmentDto, 
  CreateForumDto, 
  UpdateForumDto, 
  CreateUserDto 
} from './cms.dto';

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
  async createUniversity(@Body() data: CreateUniversityDto) {
    return this.cmsService.createUniversity(data);
  }

  @Delete('universities/:id')
  @ApiOperation({ summary: 'Admin: Delete a university' })
  @ApiParam({ name: 'id', description: 'University ID' })
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
  async createEnrollment(@Body() data: CreateEnrollmentDto) {
    return this.cmsService.createEnrollment(data);
  }

  @Patch('enrollments/:id')
  @ApiOperation({ summary: 'Admin: Update an enrollment' })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  async updateEnrollment(@Param('id') id: string, @Body() data: UpdateEnrollmentDto) {
    return this.cmsService.updateEnrollment(id, data);
  }

  @Delete('enrollments/:id')
  @ApiOperation({ summary: 'Admin: Delete an enrollment' })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
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
  async createForum(@Body() data: CreateForumDto) {
    return this.cmsService.createForum(data);
  }

  @Patch('forums/:id')
  @ApiOperation({ summary: 'Admin: Update a forum' })
  @ApiParam({ name: 'id', description: 'Forum ID' })
  async updateForum(@Param('id') id: string, @Body() data: UpdateForumDto) {
    return this.cmsService.updateForum(id, data);
  }

  @Delete('forums/:id')
  @ApiOperation({ summary: 'Admin: Delete a forum' })
  @ApiParam({ name: 'id', description: 'Forum ID' })
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
  async createUser(@Body() data: CreateUserDto) {
    return this.cmsService.createUser(data);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Admin: Delete a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
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
  @ApiParam({ name: 'id', description: 'Post ID' })
  async deletePost(@Param('id') id: string) {
    return this.cmsService.deletePost(id);
  }

  @Get('comments')
  @ApiOperation({ summary: 'Admin: List all comments for moderation' })
  async getAllComments() {
    return this.cmsService.getAllComments();
  }

  @Delete('comments/:id')
  @ApiOperation({ summary: 'Admin: Delete a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  async deleteComment(@Param('id') id: string) {
    return this.cmsService.deleteComment(id);
  }

  // --- Calendar Moderation ---
  @Get('events')
  @ApiOperation({ summary: 'Admin: List all events' })
  async getAllEvents() {
    return this.cmsService.getAllEvents();
  }

  @Patch('events/:id/approve')
  @ApiOperation({ summary: 'Admin: Approve an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async approveEvent(@Param('id') id: string) {
    return this.cmsService.approveEvent(id);
  }

  @Delete('events/:id')
  @ApiOperation({ summary: 'Admin: Delete an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async deleteEvent(@Param('id') id: string) {
    return this.cmsService.deleteEvent(id);
  }
}
