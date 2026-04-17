import { Controller, Get, Param, Query } from '@nestjs/common';
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

  @Get(':id/posts')
  @ApiOperation({ summary: 'Get all posts for a specific subject' })
  async findPosts(@Param('id') id: string) {
    return this.forumsService.findPostsByForum(id);
  }
}
