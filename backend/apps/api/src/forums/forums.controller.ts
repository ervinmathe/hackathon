import { Controller, Get, Param, Query } from '@nestjs/common';
import { ForumsService } from './forums.service';

@Controller('forums')
export class ForumsController {
  constructor(private readonly forumsService: ForumsService) {}

  @Get()
  async findAll(@Query('enrollmentId') enrollmentId?: string) {
    return this.forumsService.findAll(enrollmentId);
  }

  @Get(':id/posts')
  async findPosts(@Param('id') id: string) {
    return this.forumsService.findPostsByForum(id);
  }
}
