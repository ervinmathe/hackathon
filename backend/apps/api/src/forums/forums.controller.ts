import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ForumsService } from './forums.service';

@ApiTags('forums')
@Controller('forums')
export class ForumsController {
  constructor(private readonly forumsService: ForumsService) {}

  @Get()
  @ApiOperation({ summary: 'List all subjects/forums' })
  @ApiQuery({ name: 'enrollmentId', required: false, description: 'Filter by enrollment ID' })
  async findAll(@Query('enrollmentId') enrollmentId?: string) {
    return this.forumsService.findAll(enrollmentId);
  }

  @Get(':id/posts')
  @ApiOperation({ summary: 'Get all posts for a specific subject' })
  async findPosts(@Param('id') id: string) {
    return this.forumsService.findPostsByForum(id);
  }
}
