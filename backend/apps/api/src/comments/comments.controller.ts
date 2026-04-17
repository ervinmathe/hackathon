import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CommentsService } from './comments.service';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('post/:postId')
  @ApiOperation({ summary: 'Get all comments for a post' })
  async findByPost(@Param('postId') postId: string) {
    return this.commentsService.findByPost(postId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new comment to a post' })
  async create(
    @Body() body: { post_id: string; author_id: string; content: string },
  ) {
    return this.commentsService.create(body.post_id, body.author_id, body.content);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment' })
  async update(@Param('id') id: string, @Body('content') content: string) {
    return this.commentsService.update(id, content);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  async delete(@Param('id') id: string) {
    return this.commentsService.delete(id);
  }
}
