import { Controller, Get, Param, Query, Post, Delete, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ForumsService } from './forums.service';

@ApiTags('forums')
@Controller('forums')
export class ForumsController {
  constructor(private readonly forumsService: ForumsService) {}

  @Get()
  @ApiOperation({ summary: 'List all subjects/forums' })
  @ApiQuery({ name: 'universityId', required: false, description: 'Filter by university ID' })
  @ApiQuery({ name: 'enrollmentId', required: false, description: 'Filter by enrollment ID' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by subject name (min 3 chars)' })
  async findAll(
    @Query('universityId') universityId?: string,
    @Query('enrollmentId') enrollmentId?: string,
    @Query('search') search?: string,
  ) {
    return this.forumsService.findAll(universityId, enrollmentId, search);
  }

  @Get('my/:userId')
  @ApiOperation({ summary: 'Get forums joined by a user' })
  async findMyForums(@Param('userId') userId: string) {
    return this.forumsService.findMyForums(userId);
  }

  @Get(':id/posts')
  @ApiOperation({ summary: 'Get all posts for a specific subject' })
  async findPosts(@Param('id') id: string) {
    return this.forumsService.findPostsByForum(id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a forum' })
  async join(@Param('id') forumId: string, @Body('userId') userId: string) {
    return this.forumsService.join(userId, forumId);
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: 'Leave a forum' })
  async leave(@Param('id') forumId: string, @Query('userId') userId: string) {
    return this.forumsService.leave(userId, forumId);
  }
}
