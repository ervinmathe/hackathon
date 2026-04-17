import { Controller, Post, Body, UseInterceptors, UploadedFiles, Get, Param, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
...
import { PostsService } from './posts.service';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a single post with attachments and comments' })
  async findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new post with optional attachments' })
...
  async createPost(
    @Body() postData: any,
    @UploadedFiles() attachments: Express.Multer.File[],
  ) {
    return this.postsService.createPost(postData, attachments);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a post' })
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.postsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  async delete(@Param('id') id: string) {
    return this.postsService.delete(id);
  }

  @Delete('attachments/:attachmentId')
  @ApiOperation({ summary: 'Delete a specific attachment' })
  async removeAttachment(@Param('attachmentId') attachmentId: string) {
    return this.postsService.removeAttachment(attachmentId);
  }
}

}
